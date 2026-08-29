import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

function readText(p) {
  return fs.readFileSync(p, 'utf8')
}

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {
    datasetsDir: path.resolve(__dirname, '../datasets'),
    pattern: 'seed',
    requireApproval: false,
    dryRun: false,
    orgId: undefined,
    clientId: undefined,
    court: undefined,
    collectionMap: 'infer', // infer | none
  }

  for (const a of args) {
    if (a.startsWith('--datasetsDir=')) out.datasetsDir = a.split('=')[1]
    if (a.startsWith('--pattern=')) out.pattern = a.split('=')[1]
    if (a === '--requireApproval') out.requireApproval = true
    if (a === '--dryRun') out.dryRun = true
    if (a.startsWith('--orgId=')) out.orgId = a.split('=')[1]
    if (a.startsWith('--clientId=')) out.clientId = a.split('=')[1]
    if (a.startsWith('--court=')) out.court = a.split('=')[1]
    if (a.startsWith('--collectionMap=')) out.collectionMap = a.split('=')[1]
  }

  return out
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
  const bmMarkers = ['seksyen', 'mahkamah', 'undang-undang', 'perjanjian', 'pekerja', 'majikan', 'tuan tanah', 'penyewa']
  const lower = content.toLowerCase()
  const hits = bmMarkers.filter(m => lower.includes(m)).length
  return hits >= 2 ? 'ms' : 'en'
}

function normaliseStatus({ requireApproval }) {
  // For now: we mirror existing seed approach.
  // Vector indexing uses doc.approvedBy gating; LegalDocument uses status workflow.
  if (requireApproval) return 'review'
  return 'approved'
}

async function main() {
  const { datasetsDir, pattern, requireApproval, dryRun, orgId, clientId, court } = parseArgs()

  const files = fs
    .readdirSync(datasetsDir)
    .filter(f => f.toLowerCase().includes(pattern.toLowerCase()) && f.endsWith('.txt'))
    .sort()

  if (!files.length) {
    console.error(`No dataset .txt files found in ${datasetsDir} matching pattern='${pattern}'`)
    process.exit(1)
  }

  const toUpsert = files.map(file => {
    const content = readText(path.join(datasetsDir, file))
    const title = file.replace(/\.txt$/i, '')
    const docType = inferDocType(file)
    const language = inferLanguage(content)

    // If court param is provided, apply it; otherwise keep null.
    const status = normaliseStatus({ requireApproval })

    // We intentionally set a stable unique key via (title + content hash) isn't available.
    // So we use a simple upsert by title.
    return {
      where: { title },
      create: {
        title,
        content,
        docType,
        status,
        orgId: orgId ?? null,
        clientId: clientId ?? null,
        court: court ?? null,
        jurisdiction: null,
        tags: [`seed`, language, inferCollection(file)],
        parties: null,
        fileUrl: null,
        fileSize: null,
        mimeType: 'text/markdown',
        createdBy: 'seed',
        updatedBy: 'seed',
      },
      update: {
        content,
        docType,
        status,
        orgId: orgId ?? null,
        clientId: clientId ?? null,
        court: court ?? null,
        tags: [`seed`, language, inferCollection(file)],
        updatedBy: 'seed',
      },
    }
  })

  console.log(`Preparing upserts: ${toUpsert.length} LegalDocument rows (dryRun=${dryRun})`)

  if (dryRun) {
    for (const u of toUpsert) {
      console.log(`- ${u.where.title} (${u.create.docType}, status=${u.create.status})`)
    }
    return
  }

  // prisma.legalDocument currently has no unique constraint on title.
  // If title-only upsert fails, we fall back to create-if-not-exists by title search.
  // We'll do a best-effort: try title upsert; if unsupported, use create.
  let ok = 0
  for (const u of toUpsert) {
    try {
      await prisma.legalDocument.upsert({
        // @ts-expect-error: assumes title unique which may not be the case.
        where: u.where,
        create: u.create,
        update: u.update,
      })
      ok++
    } catch (e) {
      // fallback
      const existing = await prisma.legalDocument.findFirst({ where: { title: u.where.title } })
      if (existing) {
        await prisma.legalDocument.update({
          where: { id: existing.id },
          data: u.update,
        })
        ok++
      } else {
        await prisma.legalDocument.create({ data: u.create })
        ok++
      }
    }
  }

  console.log(`Seeded/updated LegalDocument rows: ${ok}`)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

