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

const log = agentLogger('legal-privacy')
const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') })
const connection = { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') }

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
  const { action, traceId = randomUUID(), userId, text, parties, consentPrefs } = job.data
  const start = Date.now()

  if (action === 'redact') {
    const result = detectAndRedact(text || '')
    log.info({ traceId, piiTypes: result.detected.map(d => d.type) }, 'PII redaction complete')

    await writeAuditLog({
      traceId, agentName: 'legal-privacy', userId, action: 'redact',
      input: { textLength: text?.length },
      output: { piiFound: result.detected, redactedLength: result.redacted.length },
      durationMs: Date.now() - start,
    })

    return { traceId, ...result }
  }

  if (action === 'set_consent') {
    await prisma.userConsent.upsert({
      where: { userId },
      update: consentPrefs,
      create: { userId, ...consentPrefs },
    })
    await redis.setex(`consent:${userId}`, 86400, JSON.stringify(consentPrefs))
    log.info({ traceId, userId }, 'Consent preferences updated')
    return { traceId, userId, updated: true }
  }

  if (action === 'get_consent') {
    const cached = await redis.get(`consent:${userId}`)
    if (cached) return { traceId, userId, consent: JSON.parse(cached), source: 'cache' }
    const consent = await prisma.userConsent.findUnique({ where: { userId } })
    return { traceId, userId, consent, source: 'db' }
  }

  if (action === 'minimise') {
    const minimised = minimiseForLLM(text || '', parties || {})
    return { traceId, minimised }
  }

  throw new Error(`Unknown privacy action: ${action}`)
}, { connection, concurrency: 5 })

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Privacy job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Privacy Agent started')
