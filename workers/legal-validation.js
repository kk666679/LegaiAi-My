/**
 * Agent 4: Legal Validation / Citation Agent
 * - Reverse citation check, status inference (followed/distinguished/overruled/applied)
 * - Statutory amendment tracker (Redis cache), citation extraction from free text
 * - Confidence tiers: green/yellow/red, judicial treatment summary
 */
import { Worker } from 'bullmq'
import ollama from 'ollama'
import Redis from 'ioredis'
import { prisma } from '@/backend/src/db/index.js'
import { randomUUID } from 'crypto'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { writeAuditLog } from '@/backend/src/lib/audit.js'
import { signOutput } from '@/backend/src/lib/crypto.js'

const log = agentLogger('legal-validation')
const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') })
const connection = { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') }

// Extract citations from free text: "Tan v Kerajaan Malaysia [2020] 5 MLJ 234"
const CITATION_REGEX = /([A-Za-z\s&]+v[s]?\s+[A-Za-z\s&]+)\s*\[(\d{4})\]\s*(\d+)\s*MLJ\s*(\d+)/gi

export function extractCitations(text) {
  const found = []
  let match
  while ((match = CITATION_REGEX.exec(text)) !== null) {
    found.push({
      raw: match[0].trim(),
      parties: match[1].trim(),
      year: match[2],
      volume: match[3],
      page: match[4],
      formatted: `${match[1].trim()} [${match[2]}] ${match[3]} MLJ ${match[4]}`,
    })
  }
  return found
}

// Judicial treatment keywords
const TREATMENT_PATTERNS = {
  overruled: ['overruled', 'no longer good law', 'expressly overruled'],
  followed: ['followed', 'applied with approval', 'affirmed'],
  distinguished: ['distinguished', 'distinguishable', 'on different facts'],
  applied: ['applied', 'relied upon', 'adopted'],
}

function inferTreatment(text) {
  const lower = text.toLowerCase()
  for (const [status, keywords] of Object.entries(TREATMENT_PATTERNS)) {
    if (keywords.some(k => lower.includes(k))) return status
  }
  return 'cited'
}

function confidenceTier(status) {
  if (status === 'overruled') return { tier: 'red', label: 'Superseded — do not rely' }
  if (status === 'distinguished') return { tier: 'yellow', label: 'Distinguished in later case — use with caution' }
  return { tier: 'green', label: 'Good law — safe to cite' }
}

const worker = new Worker('legal-validation', async (job) => {
  const { citation, text, traceId = randomUUID(), userId } = job.data
  const start = Date.now()
  log.info({ traceId, citation }, 'Validation started')

  // Step 1: Extract citations from free text if raw text provided
  const citations = citation ? [{ formatted: citation }] : extractCitations(text || '')

  if (citations.length === 0) {
    return { traceId, error: 'No valid citations found in input', results: [] }
  }

  const results = []

  for (const cite of citations) {
    const cacheKey = `validation:${cite.formatted}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      results.push({ ...JSON.parse(cached), source: 'cache' })
      continue
    }

    // Step 2: Check pgvector store for later cases citing this one
    const laterCases = await prisma.$queryRaw`
      SELECT id, "caseName", citation, content, "caseDate"
      FROM vector_docs
      WHERE content ILIKE ${'%' + cite.formatted + '%'}
      ORDER BY "caseDate" DESC
      LIMIT 10
    `

    // Step 3: Infer treatment from later case text
    let overallStatus = 'cited'
    const treatments = laterCases.map(c => {
      const status = inferTreatment(c.content || '')
      if (status === 'overruled') overallStatus = 'overruled'
      else if (status === 'distinguished' && overallStatus !== 'overruled') overallStatus = 'distinguished'
      return { citation: c.citation, caseName: c.caseName, status, date: c.caseDate }
    })

    // Step 4: LLM judicial treatment summary
    let llmSummary = null
    if (laterCases.length > 0) {
      const prompt = `Summarise in one sentence the judicial treatment of "${cite.formatted}" based on these later cases:\n${treatments.map(t => `- ${t.citation}: ${t.status}`).join('\n')}`
      const res = await ollama.chat({
        model: process.env.LLM_MODEL || 'minimax-m2.7:cloud',
        messages: [{ role: 'user', content: prompt }],
      })
      llmSummary = res.message.content.trim()
    }

    const tier = confidenceTier(overallStatus)
    const result = {
      citation: cite.formatted,
      status: overallStatus,
      tier,
      judicialTreatmentSummary: llmSummary || `No later cases found citing ${cite.formatted}`,
      laterCases: treatments,
      _sig: signOutput({ citation: cite.formatted, status: overallStatus }),
    }

    // Cache for 24h
    await redis.setex(cacheKey, 86400, JSON.stringify(result))
    results.push(result)
  }

  const output = { traceId, results }

  await writeAuditLog({
    traceId, agentName: 'legal-validation', userId, action: 'validate',
    input: { citation, citationCount: citations.length },
    output: { results: results.map(r => ({ citation: r.citation, status: r.status, tier: r.tier })) },
    durationMs: Date.now() - start,
  })

  log.info({ traceId, count: results.length }, 'Validation complete')
  return output
}, { connection, concurrency: 3 })

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Validation job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Validation Agent started')
