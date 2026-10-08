/**
 * Agent 14: AI Developer Worker
 * - Provides production-ready advice on building AI apps
 * - RAG, agents, vector DBs support
 */
import { Worker } from 'bullmq'
import ollama from 'ollama'
import { jobService } from '@/backend/src/lib/jobs.js'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { writeAuditLog } from '@/backend/src/lib/audit.js'
import { randomUUID } from 'crypto'
import { classifyError, DEFAULT_REDIS_CONNECTION } from '@/backend/src/lib/worker-utils.js'

const log = agentLogger('ai-developer')
const connection = DEFAULT_REDIS_CONNECTION

const LLM_TIMEOUT = 120000

const worker = new Worker('ai-developer', async (job) => {
  const { task, context = '', traceId = randomUUID(), userId, jobId } = job.data
  const start = Date.now()
  log.info({ traceId, task: task?.slice(0, 50), jobId }, 'AI Developer started')

  let unifiedJob = null
  if (jobId) {
    unifiedJob = await jobService.getById(jobId)
    if (unifiedJob) {
      await jobService.markRunning(unifiedJob.id, `worker-${process.pid}`)
    }
  }

  try {
    await jobService.markProcessing(unifiedJob?.id || '', 'processing', 20, 'Generating response')

    const response = await Promise.race([
      ollama.chat({
        model: process.env.LLM_MODEL || 'llama3.1',
        messages: [{
          role: 'user',
          content: `You are an AI & LLM Application Developer expert. User task: "${task}".\n\nContext: ${context}\n\nProvide production-ready advice on building AI apps (RAG, agents, vector DBs). Include code snippets if relevant.`,
        }],
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('LLM timeout')), LLM_TIMEOUT)),
    ])

    const output = {
      traceId,
      llm_response: response.message.content,
      complete: true,
    }

    await writeAuditLog({
      traceId, agentName: 'ai-developer', userId, action: 'advise',
      input: { task: task?.slice(0, 100) },
      output: { responseLength: response.message.content.length },
      durationMs: Date.now() - start,
    })

    if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)

    log.info({ traceId, jobId }, 'AI Developer job completed')
    return output
  } catch (err) {
    const error = err
    const { retryable, code } = classifyError(error)
    log.error({ traceId, err: error.message, retryable, code }, 'AI Developer job failed')

    if (unifiedJob) {
      if (retryable && unifiedJob.attempts < unifiedJob.maxAttempts) {
        await jobService.markRetrying(unifiedJob.id, unifiedJob.attempts + 1)
        throw error
      }
      await jobService.markFailed(unifiedJob.id, error.message, code)
    }

    throw error
  }
}, {
  connection,
  concurrency: 2,
  maxStalledCount: 2,
  removeOnFail: false,
  removeOnComplete: false,
})

worker.on('completed', (job, result) => log.info({ jobId: job.id }, 'ai-developer job completed'))
worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'ai-developer job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('AI Developer Worker started, waiting for jobs...')