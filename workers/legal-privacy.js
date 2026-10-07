/**
 * Agent 8: Privacy & Data Protection Agent
 * - PII detection (Malaysian IC, passport, addresses)
 * - Automatic redaction, consent management, data minimisation
 * - PDPA compliance, data residency logging
 */
import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { prisma } from '@/backend/src/db/index.js'
import { randomUUID } from 'crypto'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { writeAuditLog } from '@/backend/src/lib/audit.js'
import { jobService } from '@/backend/src/lib/jobs.js'
import { classifyError, DEFAULT_REDIS_CONNECTION } from '@/backend/src/lib/worker-utils.js'

const log = agentLogger('legal-privacy')
const redis = new Redis(DEFAULT_REDIS_CONNECTION)
const connection = DEFAULT_REDIS_CONNECTION

// Malaysian PII patterns
const PII_PATTERNS = [
  { name: 'MY_IC', regex: /\b\d{6}-\d{2}-\d{4}\b/g, replacement: '[REDACTED-IC]' },
  { name: 'PASSPORT', regex: /\b[A-Z]{1,2}\d{6,9}\b/g, replacement: '[REDACTED-PASSPORT]' },
  { name: 'PHONE_MY', regex: /\b(\+?60|0)[1-9]\d{7,9}\b/g, replacement: '[REDACTED-PHONE]' },
  { name: 'EMAIL', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[REDACTED-EMAIL]' },
  { name: 'ADDRESS', regex: /\b\d+[,\s]+(?:Jalan|Lorong|Taman|Persiaran|Jln|Lot)\s+[A-Za-z0-9\s,]+\b/gi, replacement: '[REDACTED-ADDRESS]' },
]

export function detectAndRedact(text) {
  let redacted = text
  const detected = []

  for (const { name, regex, replacement } of PII_PATTERNS) {
    const matches = [...text.matchAll(regex)]
    if (matches.length > 0) {
      detected.push({ type: name, count: matches.length })
      redacted = redacted.replace(regex, replacement)
    }
  }

  return { redacted, detected, hasPII: detected.length > 0 }
}

// Data minimisation: replace party names with generic labels before LLM calls
export function minimiseForLLM(text, parties = {}) {
  let minimised = text
  Object.entries(parties).forEach(([name, label], i) => {
    minimised = minimised.replaceAll(name, label || `Party ${String.fromCharCode(65 + i)}`)
  })
  return minimised
}

const worker = new Worker('legal-privacy', async (job) => {
  const { action, traceId = randomUUID(), userId, text, parties, consentPrefs, jobId } = job.data
  const start = Date.now()
  log.info({ traceId, action, jobId }, 'Privacy processing started')

  let unifiedJob = null
  if (jobId) {
    unifiedJob = await jobService.getById(jobId)
    if (unifiedJob) {
      await jobService.markRunning(unifiedJob.id, `worker-${process.pid}`)
    }
  }

  try {
    if (action === 'redact') {
      await jobService.markProcessing(unifiedJob?.id || '', 'redacting', 20, 'Detecting and redacting PII')
      const result = detectAndRedact(text || '')
      log.info({ traceId, piiTypes: result.detected.map(d => d.type) }, 'PII redaction complete')

      await writeAuditLog({
        traceId, agentName: 'legal-privacy', userId, action: 'redact',
        input: { textLength: text?.length },
        output: { piiFound: result.detected, redactedLength: result.redacted.length },
        durationMs: Date.now() - start,
      })

      const output = { traceId, ...result }
      if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)
      return output
    }

    if (action === 'set_consent') {
      await jobService.markProcessing(unifiedJob?.id || '', 'saving', 50, 'Saving consent preferences')
      await prisma.userConsent.upsert({
        where: { userId },
        update: consentPrefs,
        create: { userId, ...consentPrefs },
      })
      await redis.setex(`consent:${userId}`, 86400, JSON.stringify(consentPrefs))
      log.info({ traceId, userId }, 'Consent preferences updated')

      const output = { traceId, userId, updated: true }
      await writeAuditLog({
        traceId, agentName: 'legal-privacy', userId, action: 'set_consent',
        input: { consentPrefs },
        output: { updated: true },
        durationMs: Date.now() - start,
      })
      if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)
      return output
    }

    if (action === 'get_consent') {
      await jobService.markProcessing(unifiedJob?.id || '', 'fetching', 30, 'Fetching consent')
      const cached = await redis.get(`consent:${userId}`)
      let output
      if (cached) {
        output = { traceId, userId, consent: JSON.parse(cached), source: 'cache' }
      } else {
        const consent = await prisma.userConsent.findUnique({ where: { userId } })
        output = { traceId, userId, consent, source: 'db' }
      }
      if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)
      return output
    }

    if (action === 'minimise') {
      await jobService.markProcessing(unifiedJob?.id || '', 'minimising', 20, 'Minimising data for LLM')
      const minimised = minimiseForLLM(text || '', parties || {})
      const output = { traceId, minimised }
      if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)
      return output
    }

    throw new Error(`Unknown privacy action: ${action}`)
  } catch (err) {
    const error = err as Error
    const { retryable, code } = classifyError(error)
    log.error({ traceId, err: error.message, retryable, code }, 'Privacy job failed')

    if (unifiedJob) {
      if (retryable && unifiedJob.attempts < unifiedJob.maxAttempts) {
        await jobService.markRetrying(unifiedJob.id, unifiedJob.attempts + 1)
        throw error
      }
      await jobService.markFailed(unifiedJob.id, error.message, code)
    }

    throw error
  }
}, { connection, concurrency: 5, maxStalledCount: 2, removeOnFail: false, removeOnComplete: false })

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Privacy job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Privacy Agent started')