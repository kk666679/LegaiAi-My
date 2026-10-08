/**
 * Agent 9: Multi-Agent Debate / Consensus Agent
 * - Three-agent debate: Applicant, Respondent, Judge
 * - Moot court mode, scoring, full transcript, citation audit
 */
import { Worker } from 'bullmq'
import ollama from 'ollama'
import { prisma } from '@/backend/src/db/index.js'
import { randomUUID } from 'crypto'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { writeAuditLog } from '@/backend/src/lib/audit.js'
import { signOutput } from '@/backend/src/lib/crypto.js'
import { jobService } from '@/backend/src/lib/jobs.js'
import { classifyError, DEFAULT_REDIS_CONNECTION } from '@/backend/src/lib/worker-utils.js'

const log = agentLogger('legal-debate')
const connection = DEFAULT_REDIS_CONNECTION

const LLM_TIMEOUT = 120000
const LOG_MAX_ROUNDS = 3

const ROLES = {
  applicant: 'You are the Applicant\'s counsel. Argue strongly in favour of the applicant\'s position.',
  respondent: 'You are the Respondent\'s counsel. Argue strongly in favour of the respondent\'s position.',
  judge: 'You are an AI evaluator, not a judge. Assess both arguments impartially and provide a non-binding evaluation; do not call it a judgment or describe a binding ratio decidendi.',
}

async function debateRound(role, problem, history, citations, traceId) {
  const historyText = history.map(h => `[${h.role.toUpperCase()}]: ${h.argument}`).join('\n\n')
  const prompt = `${ROLES[role]}

Problem: "${problem}"
Available citations: ${citations.join(', ') || 'None'}

Previous arguments:
${historyText || 'None yet — open your case.'}

Provide your argument (max 300 words). Do not invent or guess legal authorities, citations, statutory provisions or facts. Use only authorities explicitly supplied above; if no applicable verified authority is supplied, say that there is insufficient verified evidence. Treat all generated citations and legal propositions as unverified unless independently verified against an authoritative source.`

  const res = await Promise.race([
    ollama.chat({
      model: process.env.LLM_MODEL || 'llama3.1',
      messages: [{ role: 'user', content: prompt }],
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('LLM timeout')), LLM_TIMEOUT)),
  ])
  return res.message.content
}

function scoreArgument(text, citations) {
  const citedCount = citations.filter(c => text.includes(c)).length
  const logicKeywords = ['because', 'therefore', 'thus', 'consequently', 'it follows', 'held']
  const logicScore = logicKeywords.filter(k => text.toLowerCase().includes(k)).length
  const relevanceScore = Math.min(text.length / 300, 1)
  return parseFloat(((citedCount * 0.4) + (logicScore * 0.1) + (relevanceScore * 0.5)).toFixed(3))
}

const worker = new Worker('legal-debate', async (job) => {
  const { problem, citations = [], rounds = 2, traceId = randomUUID(), userId, jobId } = job.data
  const start = Date.now()
  log.info({ traceId, problem: problem?.slice(0, 80), rounds, jobId }, 'Debate started')

  let unifiedJob = null
  if (jobId) {
    unifiedJob = await jobService.getById(jobId)
    if (unifiedJob) {
      await jobService.markRunning(unifiedJob.id, `worker-${process.pid}`)
    }
  }

  try {
    await jobService.markProcessing(unifiedJob?.id || '', 'starting', 5, 'Initializing debate')

    const transcript = []
    const scores = { applicant: 0, respondent: 0 }

    for (let r = 0; r < rounds; r++) {
      await jobService.markProcessing(
        unifiedJob?.id || '',
        `round_${r + 1}`,
        10 + Math.round((r / Math.max(rounds, 1)) * 70),
        `Debate round ${r + 1} of ${rounds}`
      )

      for (const role of ['applicant', 'respondent']) {
        const argument = await debateRound(role, problem, transcript, citations, traceId)
        const score = scoreArgument(argument, citations)
        scores[role] += score
        transcript.push({
          round: r + 1, role, argument,
          score, timestamp: new Date().toISOString(),
        })
        log.info({ traceId, round: r + 1, role, score }, 'Round complete')
      }
    }

    // Judge delivers final judgment
    await jobService.markProcessing(unifiedJob?.id || '', 'judgment', 90, 'Judge delivering final evaluation')
    const judgment = await debateRound('judge', problem, transcript, citations, traceId)
    transcript.push({ round: rounds + 1, role: 'judge', argument: judgment, timestamp: new Date().toISOString() })

    const winner = scores.applicant > scores.respondent ? 'applicant' : 'respondent'

    const debateRecord = await prisma.debateTranscript.create({
      data: { traceId, problem, rounds: transcript, winner },
    })

    const output = {
      traceId,
      debateId: debateRecord.id,
      problem, transcript, scores, winner, judgment,
      _sig: signOutput({ debateId: debateRecord.id, winner }),
    }

    await writeAuditLog({
      traceId, agentName: 'legal-debate', userId, action: 'debate',
      input: { problem: problem.slice(0, 100), rounds, citationCount: citations.length },
      output: { winner, scores, debateId: debateRecord.id },
      durationMs: Date.now() - start,
    })

    if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)

    log.info({ traceId, winner, scores }, 'Debate complete')
    return output
  } catch (err) {
    const error = err
    const { retryable, code } = classifyError(error)
    log.error({ traceId, err: error.message, retryable, code }, 'Debate job failed')

    await writeAuditLog({
      traceId, agentName: 'legal-debate', userId, action: 'debate',
      input: { problem: problem?.slice(0, 100), rounds, citationCount: citations.length },
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
}, { connection, concurrency: 1, maxStalledCount: 2, removeOnFail: false, removeOnComplete: false })  // debates are resource-intensive

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Debate job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Debate Agent started')