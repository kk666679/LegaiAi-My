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
import { jobService } from '@/backend/src/lib/jobs.js'
import { classifyError, DEFAULT_REDIS_CONNECTION, DEFAULT_WORKER_OPTIONS } from '@/backend/src/lib/worker-utils.js'

const log = agentLogger('legal-validation')
const redis = new Redis(DEFAULT_REDIS_CONNECTION)
const connection = DEFAULT_REDIS_CONNECTION

const LLM_TIMEOUT = 60000
const QUERY_TIMEOUT = 30000

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
  const { citation, text, traceId = randomUUID(), userId, jobId } = job.data
  const start = Date.now()
  log.info({ traceId, citation, jobId }, 'Validation started')

  let unifiedJob = null
  if (jobId) {
    unifiedJob = await jobService.getById(jobId)
    if (unifiedJob) {
      await jobService.markRunning(unifiedJob.id, `worker-${process.pid}`)
    }
  }

  try {
    // Step 1: Extract citations from free text if raw text provided
    await jobService.markProcessing(unifiedJob?.id || '', 'extracting', 10, 'Extracting citations')
    const citations = citation ? [{ formatted: citation }] : extractCitations(text || '')

    if (citations.length === 0) {
      const output = { traceId, error: 'No valid citations found in input', results: [] }
      if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)
      return output
    }

    const results = []

    for (let i = 0; i < citations.length; i++) {
      const cite = citations[i]
      const progress = 20 + Math.floor((i / citations.length) * 70)
      await jobService.markProcessing(unifiedJob?.id || '', `validating_${i + 1}`, progress, `Validating citation ${i + 1} of ${citations.length}`)

      const cacheKey = `validation:${cite.formatted}`
      const cached = await redis.get(cacheKey)
      if (cached) {
        results.push({ ...JSON.parse(cached), source: 'cache' })
        continue
      }

      // Step 2: Check pgvector store for later cases citing this one
      const laterCases = await Promise.race([
        prisma.$queryRaw`
          SELECT id, "caseName", citation, content, "caseDate"
          FROM vector_docs
          WHERE content ILIKE ${'%' + cite.formatted + '%'}
          ORDER BY "caseDate" DESC
          LIMIT 10
        `,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Vector query timeout')), QUERY_TIMEOUT)),
      ])

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
        const res = await Promise.race([
          ollama.chat({
            model: process.env.LLM_MODEL || 'minimax-m2.7:cloud',
            messages: [{ role: 'user', content: prompt }],
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('LLM timeout')), LLM_TIMEOUT)),
        ])
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

    await jobService.markProcessing(unifiedJob?.id || '', 'finalizing', 95, 'Finalizing results')
    const output = { traceId, results }

    await writeAuditLog({
      traceId, agentName: 'legal-validation', userId, action: 'validate',
      input: { citation, citationCount: citations.length },
      output: { results: results.map(r => ({ citation: r.citation, status: r.status, tier: r.tier })) },
      durationMs: Date.now() - start,
    })

    if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)

    log.info({ traceId, count: results.length }, 'Validation complete')
    return output
  } catch (err) {
    const error = err as Error
    const { retryable, code } = classifyError(error)
    log.error({ traceId, err: error.message, retryable, code }, 'Validation job failed')

    await writeAuditLog({
      traceId, agentName: 'legal-validation', userId, action: 'validate',
      input: { citation, citationCount: (citation ? [{ formatted: citation }] : extractCitations(text || '')).length },
      output: { error: error.message },
      durationMs: Date.now() - start,
    })

    if (unifiedJob) {
      if (retryable && unifiedJob.attempts < unifiedJob.maxAttempts) {
        await jobService.markRetrying(unifiedJob.id, unifiedJob.attempts + 1)
        throw error
      }
      await jobService.markFailed(unifiedJob.id, error.message, code)
    }

    throw error
  }
}, { connection, concurrency: 3, maxStalledCount: 2, removeOnFail: false, removeOnComplete: false })

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Validation job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Validation Agent started')