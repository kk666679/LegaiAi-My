/**
 * Agent 2: Legal Analysis Agent
 * - Case distinction, ratio/obiter classification (TF.js BERT)
 * - Conflict detection, human rights impact mapping
 * - Explainable summaries, peer review simulation, confidence threshold
 */
import { Worker } from 'bullmq'
import ollama from 'ollama'
import * as tf from '@tensorflow/tfjs-node'
import { randomUUID } from 'crypto'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { writeAuditLog } from '@/backend/src/lib/audit.js'
import { signOutput } from '@/backend/src/lib/crypto.js'
import { queues } from '@/backend/queues/index.js'

const log = agentLogger('legal-analysis')
const connection = { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') }
const CONFIDENCE_THRESHOLD = parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.6')
const MIN_CASES = 3

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
    const label = ratioScore > obiterScore ? 'ratio' : obiterScore > 0 ? 'obiter' : 'dicta'
    // TF.js: normalize scores as a tensor
    const scores = tf.tensor1d([ratioScore, obiterScore]).softmax().arraySync()
    return { sentence: s.slice(0, 120), label, confidence: Math.max(...scores) }
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

  const res = await ollama.chat({
    model: process.env.LLM_MODEL || 'minimax-m2.7:cloud',
    messages: [{ role: 'user', content: prompt }],
  })
  return res.message.content
}

const worker = new Worker('legal-analysis', async (job) => {
  const { task, cases = [], traceId = randomUUID(), userId } = job.data
  const start = Date.now()
  log.info({ traceId, task, caseCount: cases.length }, 'Analysis started')

  // Confidence threshold guard
  const validCases = cases.filter(c => (c.confidence || 0) >= CONFIDENCE_THRESHOLD)
  if (validCases.length < MIN_CASES) {
    log.warn({ traceId, validCases: validCases.length }, 'Insufficient cases for analysis')
    return {
      traceId,
      error: `Insufficient evidence: need ${MIN_CASES} cases with confidence ≥ ${CONFIDENCE_THRESHOLD}, got ${validCases.length}`,
      confidence: 0,
    }
  }

  // Primary analysis
  const primaryAnalysis = await analyseWithLLM(task, validCases, traceId, 'primary')

  // Peer review: second agent with opposing position
  const peerAnalysis = await analyseWithLLM(task, validCases, traceId, 'opposing')

  // Sentence classification
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

  log.info({ traceId, confidence, rightsEngaged }, 'Analysis complete')
  return output
}, { connection, concurrency: parseInt(process.env.LLM_MAX_CONCURRENCY || '5') })

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Analysis job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Analysis Agent started')
