/**
 * Agent 5: Audit & Logging Agent
 * - Immutable hash-chain logs, anomaly detection (TF.js), legal hold
 * - PDPA compliance, searchable JSONL, right to be forgotten
 */
import { Worker } from 'bullmq'
import * as tf from '@tensorflow/tfjs-node'
import { prisma } from '@/backend/src/db/index.js'
import { createWriteStream, appendFileSync } from 'fs'
import { randomUUID } from 'crypto'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { writeAuditLog, applyLegalHold, forgetUser } from '@/backend/src/lib/audit.js'
import { sha256 } from '@/backend/src/lib/crypto.js'

const log = agentLogger('legal-audit')
const connection = { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') }
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

  const t = tf.tensor1d(durationWindow)
  const mean = t.mean().arraySync()
  const std = t.sub(mean).square().mean().sqrt().arraySync()
  const z = std > 0 ? Math.abs((durationMs - mean) / std) : 0
  return z > ANOMALY_Z_THRESHOLD
}

import { Worker as BullWorker } from 'bullmq'

const worker = new BullWorker('legal-audit', async (job) => {
  const { action, traceId = randomUUID(), userId, caseId, data } = job.data

  if (action === 'legal_hold') {
    await applyLegalHold(caseId)
    log.info({ traceId, caseId }, 'Legal hold applied')
    return { traceId, action, caseId, applied: true }
  }

  if (action === 'forget_user') {
    await forgetUser(userId)
    log.info({ traceId, userId }, 'User data deleted (PDPA right to be forgotten)')
    return { traceId, action, userId, deleted: true }
  }

  if (action === 'log') {
    const entry = { ...data, traceId, timestamp: new Date().toISOString() }

    // Anomaly detection
    if (data.durationMs) {
      const isAnomaly = detectAnomaly(data.durationMs)
      if (isAnomaly) {
        log.warn({ traceId, durationMs: data.durationMs }, '⚠️ Anomaly detected in agent duration')
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

    return { traceId, logged: true, anomaly: entry.anomaly || false }
  }

  throw new Error(`Unknown audit action: ${action}`)
}, { connection, concurrency: 10 })

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Audit job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Audit Agent started')
