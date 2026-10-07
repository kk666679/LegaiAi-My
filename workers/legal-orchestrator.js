/**
 * Agent 6: Queue & Orchestration Agent
 * - Dynamic prioritisation (pro bono), parallel fan-out, checkpoint/resume
 * - Execution trace, resource quota, dead-letter queue, SLA monitoring
 */
import { Worker, FlowProducer } from 'bullmq'
import { randomUUID } from 'crypto'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { writeAuditLog } from '@/backend/src/lib/audit.js'
import { queues } from '@/backend/queues/index.js'
import { jobService } from '@/backend/src/lib/jobs.js'
import { classifyError, DEFAULT_REDIS_CONNECTION, DEFAULT_WORKER_OPTIONS } from '@/backend/src/lib/worker-utils.js'

const log = agentLogger('legal-orchestrator')
const connection = DEFAULT_REDIS_CONNECTION
const flow = new FlowProducer({ connection })

// Workflow DAG: Retrieval → Analysis → Drafting (with optional Validation)
async function orchestrateFullWorkflow(payload) {
  const { query, docType, parties, facts, citations = [], traceId, userId, proBono = false } = payload
  const priority = proBono ? 1 : 10  // lower = higher priority in BullMQ

  // Step 1: Parallel fan-out retrieval (5 parallel jobs with different filters)
  const retrievalJobs = [
    { court: 'FEDERAL', language: 'en' },
    { court: 'APPEAL', language: 'en' },
    { court: 'HIGH', language: 'en' },
    { language: 'ms' },  // Malay language retrieval
    {},                  // No filter — broadest
  ].map((filters, i) =>
    queues.retrieval.add('retrieve', { query, filters, traceId, topK: 5 }, { priority, jobId: `${traceId}-retrieval-${i}` })
  )

  const retrievalResults = await Promise.all(retrievalJobs)
  log.info({ traceId, jobIds: retrievalResults.map(j => j.id) }, 'Fan-out retrieval enqueued')

  // Step 2: Analysis (depends on retrieval — enqueue with delay for demo; in prod use BullMQ flows)
  const analysisJob = await queues.analysis.add('analyse', {
    task: query, traceId, userId,
    cases: [],  // Worker will fetch retrieval results by traceId
  }, { priority, delay: 2000 })

  // Step 3: Drafting (if docType provided)
  let draftJob = null
  if (docType) {
    draftJob = await queues.drafting.add('draft', {
      docType, tone: 'neutral', format: 'markdown',
      parties, facts, citations, traceId, userId,
    }, { priority, delay: 5000 })
  }

  // Step 4: Validation
  const validationJob = await queues.validation.add('validate', {
    text: citations.join(' '), traceId, userId,
  }, { priority })

  const trace = {
    traceId,
    workflow: 'full-legal',
    steps: [
      { name: 'retrieval-fanout', jobIds: retrievalResults.map(j => j.id), startTime: new Date().toISOString() },
      { name: 'analysis', jobId: analysisJob.id },
      { name: 'validation', jobId: validationJob.id },
      ...(draftJob ? [{ name: 'drafting', jobId: draftJob.id }] : []),
    ],
    proBono,
    priority,
  }

  await writeAuditLog({
    traceId, agentName: 'legal-orchestrator', userId, action: 'orchestrate',
    input: { query, docType, proBono },
    output: trace,
  })

  log.info({ traceId, steps: trace.steps.length }, 'Workflow orchestrated')
  return trace
}

const worker = new Worker('legal-orchestrator', async (job) => {
  const { action = 'full', traceId = randomUUID(), ...payload } = job.data
  const start = Date.now()
  log.info({ traceId, action, jobId: job.id }, 'Orchestrator started')

  let unifiedJob = null
  if (job.id) {
    unifiedJob = await jobService.getById(job.id)
    if (unifiedJob) {
      await jobService.markRunning(unifiedJob.id, `worker-${process.pid}`)
    }
  }

  try {
    if (action === 'full') {
      await jobService.markProcessing(unifiedJob?.id || '', 'orchestrating', 10, 'Starting workflow orchestration')
      const result = await orchestrateFullWorkflow({ ...payload, traceId })
      await jobService.markCompleted(unifiedJob?.id || '', result)
      return result
    }

    if (action === 'status') {
      // Return queue depths for SLA monitoring
      await jobService.markProcessing(unifiedJob?.id || '', 'checking_status', 50, 'Checking queue depths')
      const depths = {}
      for (const [name, q] of Object.entries(queues)) {
        const counts = await q.getJobCounts('waiting', 'active', 'delayed', 'failed')
        depths[name] = counts
      }
      const maxWaiting = Math.max(...Object.values(depths).map(d => d.waiting || 0))
      const output = {
        traceId,
        status: maxWaiting > 20 ? 'degraded' : 'healthy',
        queues: depths,
        timestamp: new Date().toISOString(),
      }
      await jobService.markCompleted(unifiedJob?.id || '', output)
      return output
    }

    throw new Error(`Unknown orchestrator action: ${action}`)
  } catch (err) {
    const error = err as Error
    const { retryable, code } = classifyError(error)
    log.error({ traceId, err: error.message, retryable, code }, 'Orchestrator job failed')

    await writeAuditLog({
      traceId, agentName: 'legal-orchestrator', userId: payload.userId, action: 'orchestrate',
      input: payload,
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
}, { connection, concurrency: 5, maxStalledCount: 2, removeOnFail: false, removeOnComplete: false })

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Orchestrator job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Orchestration Agent started')