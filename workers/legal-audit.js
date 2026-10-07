/**
 * Agent 5: Audit & Logging Agent
 * - Immutable hash-chain logs, anomaly detection (TF.js), legal hold
 * - PDPA compliance, searchable JSONL, right to be forgotten
 */
import { Worker, Worker as BullWorker } from 'bullmq'
import { prisma } from '@/backend/src/db/index.js'
import { createWriteStream, appendFileSync } from 'fs'
import { randomUUID } from 'crypto'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { writeAuditLog, applyLegalHold, forgetUser } from '@/backend/src/lib/audit.js'
import { sha256 } from '@/backend/src/lib/crypto.js'
import { jobService } from '@/backend/src/lib/jobs.js'
import { classifyError, DEFAULT_REDIS_CONNECTION, DEFAULT_WORKER_OPTIONS } from '@/backend/src/lib/worker-utils.js'

const log = agentLogger('legal-audit')
const connection = DEFAULT_REDIS_CONNECTION
const JSONL_PATH = './logs/audit.jsonl'

// Ensure logs dir
import { mkdirSync } from 'fs'
try { mkdirSync('./logs', { recursive: true }) } catch {}

// TF.js anomaly detection: Z-score on rolling window of durationMs
const durationWindow = []
const WINDOW_SIZE = 50
const ANOMALY_Z_THRESHOLD = 3.0

function detectAnomaly(durationMs) {
  durationWindow.push(durationMs)
  if (durationWindow.length > WINDOW_SIZE) durationWindow.shift()
  if (durationWindow.length < 10) return false
  const mean = durationWindow.reduce((a, b) => a + b, 0) / durationWindow.length
  const std = Math.sqrt(durationWindow.reduce((a, b) => a + (b - mean) ** 2, 0) / durationWindow.length)
  const z = std > 0 ? Math.abs((durationMs - mean) / std) : 0
  return z > ANOMALY_Z_THRESHOLD
}

const worker = new BullWorker('legal-audit', async (job) => {
  const { action, traceId = randomUUID(), userId, caseId, data, jobId } = job.data
  const start = Date.now()
  log.info({ traceId, action, jobId }, 'Audit job started')

  let unifiedJob = null
  if (jobId) {
    unifiedJob = await jobService.getById(jobId)
    if (unifiedJob) {
      await jobService.markRunning(unifiedJob.id, `worker-${process.pid}`)
    }
  }

  try {
    if (action === 'legal_hold') {
      await jobService.markProcessing(unifiedJob?.id || '', 'legal_hold', 50, 'Applying legal hold')
      await applyLegalHold(caseId)
      log.info({ traceId, caseId }, 'Legal hold applied')

      const output = { traceId, action, caseId, applied: true }
      if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)
      return output
    }

    if (action === 'forget_user') {
      await jobService.markProcessing(unifiedJob?.id || '', 'forgetting', 50, 'Deleting user data')
      await forgetUser(userId)
      log.info({ traceId, userId }, 'User data deleted (PDPA right to be forgotten)')

      const output = { traceId, action, userId, deleted: true }
      if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)
      return output
    }

    if (action === 'log') {
      await jobService.markProcessing(unifiedJob?.id || '', 'logging', 50, 'Writing audit log')
      const entry = { ...data, traceId, timestamp: new Date().toISOString() }

      // Anomaly detection
      if (data.durationMs) {
        const isAnomaly = detectAnomaly(data.durationMs)
        if (isAnomaly) {
          log.warn({ traceId, durationMs: data.durationMs }, 'Anomaly detected in agent duration')
          entry.anomaly = true
        }
      }

      // Append to JSONL for searchable structured logs
      appendFileSync(JSONL_PATH, JSON.stringify(entry) + '\n')

      await writeAuditLog({
        traceId, agentName: data.agentName || 'unknown', userId,
        action: data.action || 'log', input: data.input, output: data.output,
        confidence: data.confidence, durationMs: data.durationMs, caseId,
      })

      const output = { traceId, logged: true, anomaly: entry.anomaly || false }
      if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)
      return output
    }

    throw new Error(`Unknown audit action: ${action}`)
  } catch (err) {
    const error = err as Error
    const { retryable, code } = classifyError(error)
    log.error({ traceId, err: error.message, retryable, code }, 'Audit job failed')

    if (unifiedJob) {
      if (retryable && unifiedJob.attempts < unifiedJob.maxAttempts) {
        await jobService.markRetrying(unifiedJob.id, unifiedJob.attempts + 1)
        throw error
      }
      await jobService.markFailed(unifiedJob.id, error.message, code)
    }

    throw error
  }
}, { connection, concurrency: 10, maxStalledCount: 2, removeOnFail: false, removeOnComplete: false })

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Audit job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Audit Agent started')