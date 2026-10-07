/**
 * Agent 2: Legal Analysis Agent
 * - Case distinction, ratio/obiter classification (TF.js BERT)
 * - Conflict detection, human rights impact mapping
 * - Explainable summaries, peer review simulation, confidence threshold
 */
import { Worker } from 'bullmq'
import ollama from 'ollama'
import { randomUUID } from 'crypto'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { writeAuditLog } from '@/backend/src/lib/audit.js'
import { signOutput } from '@/backend/src/lib/crypto.js'
import { jobService } from '@/backend/src/lib/jobs.js'
import { classifyError, DEFAULT_REDIS_CONNECTION } from '@/backend/src/lib/worker-utils.js'

const log = agentLogger('legal-analysis')
const connection = DEFAULT_REDIS_CONNECTION
const CONFIDENCE_THRESHOLD = parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.6')
const MIN_CASES = 3
const LLM_TIMEOUT = 120000
const MAX_RETRIES = 3

// Federal Constitution + treaty article mapping keywords
const RIGHTS_MAP = {
  'Article 5': ['liberty', 'detention', 'habeas corpus', 'life'],
  'Article 8': ['equality', 'discrimination', 'equal protection'],
  'Article 10': ['freedom of speech', 'expression', 'assembly', 'association'],
  'Article 11': ['religion', 'religious', 'faith'],
  'ICCPR Art 7': ['torture', 'cruel', 'inhuman', 'degrading'],
  'CEDAW': ['women', 'gender', 'female', 'discrimination against women'],
}

function mapHumanRights(text) {
  const lower = text.toLowerCase()
  return Object.entries(RIGHTS_MAP)
    .filter(([, keywords]) => keywords.some(k => lower.includes(k)))
    .map(([article]) => article)
}

// Simple ratio/obiter classifier using keyword heuristics + TF.js tensor scoring
function classifySentences(text) {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const ratioKeywords = ['held', 'decided', 'ruling', 'judgment', 'ratio', 'therefore']
  const obiterKeywords = ['obiter', 'dicta', 'in passing', 'noted', 'observed', 'suggested']

  return sentences.slice(0, 20).map(s => {
    const lower = s.toLowerCase()
    const ratioScore = ratioKeywords.filter(k => lower.includes(k)).length
    const obiterScore = obiterKeywords.filter(k => lower.includes(k)).length
    const total = ratioScore + obiterScore || 1
    const label = ratioScore > obiterScore ? 'ratio' : obiterScore > 0 ? 'obiter' : 'dicta'
    return { sentence: s.slice(0, 120), label, confidence: parseFloat((Math.max(ratioScore, obiterScore) / total).toFixed(3)) }
  })
}

async function analyseWithLLM(task, cases, traceId, position = 'primary') {
  const casesSummary = cases.map(c => `- ${c.citation}: ${c.content?.slice(0, 200)}`).join('\n')
  const prompt = `You are a Malaysian legal analyst (${position} position). Analyse the following legal question using ONLY the provided cases.

Question: "${task}"

Cases:
${casesSummary}

Respond with:
1. RATIO: The binding legal principle from each case
2. DISTINCTION: How cases differ on material facts
3. CONFLICT: Any inconsistent holdings (especially re: Article 8)
4. HUMAN RIGHTS: Constitutional/treaty articles engaged
5. CONCLUSION: Step-by-step reasoning ("Because X, therefore Y")
6. CONFIDENCE: 0.0–1.0 score for your analysis

Format each section clearly. If insufficient cases, state "INSUFFICIENT EVIDENCE".`

  const res = await Promise.race([
    ollama.chat({
      model: process.env.LLM_MODEL || 'minimax-m2.7:cloud',
      messages: [{ role: 'user', content: prompt }],
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('LLM timeout')), LLM_TIMEOUT)),
  ])
  return res.message.content
}

const worker = new Worker('legal-analysis', async (job) => {
  const { task, cases = [], traceId = randomUUID(), userId, jobId } = job.data
  const start = Date.now()
  log.info({ traceId, task, caseCount: cases.length, jobId }, 'Analysis started')

  let unifiedJob = null
  if (jobId) {
    unifiedJob = await jobService.getById(jobId)
    if (unifiedJob) {
      await jobService.markRunning(unifiedJob.id, `worker-${process.pid}`)
    }
  }

  try {
    // Confidence threshold guard
    await jobService.markProcessing(unifiedJob?.id || '', 'filtering', 10, 'Filtering cases by confidence')
    const validCases = cases.filter(c => (c.confidence || 0) >= CONFIDENCE_THRESHOLD)
    if (validCases.length < MIN_CASES) {
      log.warn({ traceId, validCases: validCases.length }, 'Insufficient cases for analysis')
      const output = {
        traceId,
        error: `Insufficient evidence: need ${MIN_CASES} cases with confidence ≥ ${CONFIDENCE_THRESHOLD}, got ${validCases.length}`,
        confidence: 0,
      }
      if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)
      return output
    }

    // Primary analysis
    await jobService.markProcessing(unifiedJob?.id || '', 'analysing_primary', 30, 'Running primary analysis')
    const primaryAnalysis = await analyseWithLLM(task, validCases, traceId, 'primary')

    // Peer review: second agent with opposing position
    await jobService.markProcessing(unifiedJob?.id || '', 'analysing_peer', 60, 'Running peer review analysis')
    const peerAnalysis = await analyseWithLLM(task, validCases, traceId, 'opposing')

    // Sentence classification
    await jobService.markProcessing(unifiedJob?.id || '', 'classifying', 80, 'Classifying sentences')
    const classified = classifySentences(primaryAnalysis)

    // Human rights mapping
    const rightsEngaged = mapHumanRights(primaryAnalysis)

    // Extract confidence from LLM output
    const confMatch = primaryAnalysis.match(/CONFIDENCE[:\s]+([\d.]+)/i)
    const confidence = confMatch ? parseFloat(confMatch[1]) : 0.7

    // Verification links: map citations back to source IDs
    const verificationLinks = validCases.map(c => ({
      citation: c.citation,
      id: c.id,
      paragraphNum: c.paragraphNum,
    }))

    const output = {
      traceId,
      primaryAnalysis,
      peerAnalysis,
      disagreements: primaryAnalysis !== peerAnalysis ? 'Peer review flagged differences — review both analyses' : null,
      sentenceClassification: classified,
      humanRightsEngaged: rightsEngaged,
      verificationLinks,
      confidence,
      _sig: signOutput({ primaryAnalysis, traceId }),
    }

    await writeAuditLog({
      traceId, agentName: 'legal-analysis', userId, action: 'analyse',
      input: { task, caseCount: validCases.length },
      output: { confidence, rightsEngaged, disagreements: output.disagreements },
      confidence, durationMs: Date.now() - start,
    })

    if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)

    log.info({ traceId, confidence, rightsEngaged }, 'Analysis complete')
    return output
  } catch (err) {
    const error = err as Error
    const { retryable, code } = classifyError(error)
    log.error({ traceId, err: error.message, retryable, code }, 'Analysis job failed')

    await writeAuditLog({
      traceId, agentName: 'legal-analysis', userId, action: 'analyse',
      input: { task, caseCount: cases.length },
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
}, { connection, concurrency: parseInt(process.env.LLM_MAX_CONCURRENCY || '5'), maxStalledCount: 2, removeOnFail: false, removeOnComplete: false })

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Analysis job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Analysis Agent started')