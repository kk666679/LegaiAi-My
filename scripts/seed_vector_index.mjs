import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

import ollama from 'ollama'
import { queues } from '../backend/queues/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function readText(p) {
  return fs.readFileSync(p, 'utf8')
}

function inferDocType(fileName) {
  const s = fileName.toLowerCase()
  if (s.includes('employment')) return 'LETTER'
  if (s.includes('privacy') || s.includes('pdpa')) return 'MEMORANDUM'
  if (s.includes('tenancy')) return 'AGREEMENT'
  if (s.includes('tort') || s.includes('limitation')) return 'BRIEF'
  if (s.includes('contract')) return 'AGREEMENT'
  if (s.includes('constitutional') || s.includes('criminal') || s.includes('land') || s.includes('company') || s.includes('administrative') || s.includes('insolvency') || s.includes('intellectual')) return 'BRIEF'
  if (s.includes('syariah')) return 'MEMORANDUM'
  return 'OTHER'
}

function inferCollection(fileName) {
  const s = fileName.toLowerCase()
  if (s.includes('constitutional')) return 'constitutional_law'
  if (s.includes('company')) return 'company_law'
  if (s.includes('criminal')) return 'criminal_law'
  if (s.includes('land')) return 'land_law'
  if (s.includes('syariah')) return 'syariah_law'
  if (s.includes('administrative')) return 'administrative_law'
  if (s.includes('insolvency')) return 'insolvency_law'
  if (s.includes('intellectual')) return 'intellectual_property'
  if (s.includes('employment')) return 'employment_law'
  if (s.includes('pdpa') || s.includes('privacy')) return 'pdpa_privacy'
  if (s.includes('tenancy')) return 'property_law'
  if (s.includes('tort')) return 'tort_law'
  return 'legal_contracts'
}

function inferLanguage(content) {
  // Simple heuristic: BM keywords
  const bmMarkers = ['seksyen', 'mahkamah', 'undang-undang', 'perjanjian', 'pekerja', 'majikan', 'tuan tanah', 'penyewa']
  const lower = content.toLowerCase()
  const hits = bmMarkers.filter(m => lower.includes(m)).length
  return hits >= 2 ? 'ms' : 'en'
}

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {
    collection: 'all',
    datasetsDir: path.resolve(__dirname, '../datasets'),
    requireApproval: false,
    concurrencyHint: 1,
    pattern: 'seed',
  }

  for (const a of args) {
    if (a.startsWith('--collection=')) out.collection = a.split('=')[1]
    if (a.startsWith('--datasetsDir=')) out.datasetsDir = a.split('=')[1]
    if (a === '--requireApproval') out.requireApproval = true
    if (a.startsWith('--pattern=')) out.pattern = a.split('=')[1]
  }
  return out
}

async function main() {
  const { collection, datasetsDir, requireApproval, pattern } = parseArgs()

  const files = fs
    .readdirSync(datasetsDir)
    .filter(f => f.toLowerCase().includes(pattern.toLowerCase()) && f.endsWith('.txt'))
    .sort()

  if (!files.length) {
    console.error(`No dataset .txt files found in ${datasetsDir} matching pattern='${pattern}'`)
    process.exit(1)
  }

  const documents = files.map((file, idx) => {
    const content = readText(path.join(datasetsDir, file))
    const fileCollection = collection === 'all' ? inferCollection(file) : collection
    const language = inferLanguage(content)
    return {
      id: `seed-${idx + 1}-${randomUUID()}`,
      title: file.replace(/\.txt$/i, ''),
      content,
      docType: inferDocType(file),
      status: 'draft',
      tags: ['seed', 'malaysia', language],
      approvedBy: requireApproval ? undefined : 'seed',
      indexVersion: 1,
      metadata: {
        sourceFile: file,
        seed: true,
        collection: fileCollection,
        language,
      },
      collection: fileCollection,
    }
  })

  // Group by collection and enqueue one job per collection
  const byCollection = documents.reduce((acc, doc) => {
    const col = doc.collection
    if (!acc[col]) acc[col] = []
    acc[col].push(doc)
    return acc
  }, {})

  const traceId = randomUUID()
  for (const [col, docs] of Object.entries(byCollection)) {
    console.log(`Enqueuing: collection='${col}', docs=${docs.length}`)
    await queues.indexing.add('index', { traceId, collection: col, requireApproval, documents: docs })
  }
  console.log(`Enqueued ${documents.length} documents across ${Object.keys(byCollection).length} collections. traceId=${traceId}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

