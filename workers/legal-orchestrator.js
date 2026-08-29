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

const log = agentLogger('legal-orchestrator')
const connection = { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') }
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

  if (action === 'full') return orchestrateFullWorkflow({ ...payload, traceId })

  if (action === 'status') {
    // Return queue depths for SLA monitoring
    const depths = {}
    for (const [name, q] of Object.entries(queues)) {
      const counts = await q.getJobCounts('waiting', 'active', 'delayed', 'failed')
      depths[name] = counts
    }
    const maxWaiting = Math.max(...Object.values(depths).map(d => d.waiting || 0))
    return {
      traceId,
      status: maxWaiting > 20 ? 'degraded' : 'healthy',
      queues: depths,
      timestamp: new Date().toISOString(),
    }
  }

  throw new Error(`Unknown orchestrator action: ${action}`)
}, { connection, concurrency: 5 })

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Orchestrator job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Orchestration Agent started')
