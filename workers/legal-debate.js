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

const log = agentLogger('legal-debate')
const connection = { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') }

const ROLES = {
  applicant: 'You are the Applicant\'s counsel. Argue strongly in favour of the applicant\'s position.',
  respondent: 'You are the Respondent\'s counsel. Argue strongly in favour of the respondent\'s position.',
  judge: 'You are an AI evaluator, not a judge. Assess both arguments impartially and provide a non-binding evaluation; do not call it a judgment or describe a binding ratio decidendi.',
}

async function debateRound(role, problem, history, citations) {
  const historyText = history.map(h => `[${h.role.toUpperCase()}]: ${h.argument}`).join('\n\n')
  const prompt = `${ROLES[role]}

Problem: "${problem}"
Available citations: ${citations.join(', ') || 'None'}

Previous arguments:
${historyText || 'None yet — open your case.'}

Provide your argument (max 300 words). Do not invent or guess legal authorities, citations, statutory provisions or facts. Use only authorities explicitly supplied above; if no applicable verified authority is supplied, say that there is insufficient verified evidence. Treat all generated citations and legal propositions as unverified unless independently verified against an authoritative source.`

  const res = await ollama.chat({
    model: process.env.LLM_MODEL || 'llama3.1',
    messages: [{ role: 'user', content: prompt }],
  })
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
  const { problem, citations = [], rounds = 2, traceId = randomUUID(), userId } = job.data
  const start = Date.now()
  log.info({ traceId, problem: problem.slice(0, 80) }, 'Debate started')

  const transcript = []
  const scores = { applicant: 0, respondent: 0 }

  for (let r = 0; r < rounds; r++) {
    for (const role of ['applicant', 'respondent']) {
      const argument = await debateRound(role, problem, transcript, citations)
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
  const judgment = await debateRound('judge', problem, transcript, citations)
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

  log.info({ traceId, winner, scores }, 'Debate complete')
  return output
}, { connection, concurrency: 1 })  // debates are resource-intensive

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Debate job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Debate Agent started')
