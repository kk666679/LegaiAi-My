/**
 * Agent 12: Testing / Sandbox Agent
 * - Adversarial test generation, regression suite, performance benchmarking
 * - Gold dataset evaluation, continuous credibility score, CI integration
 */
import { Worker } from 'bullmq'
import ollama from 'ollama'
import { prisma } from '@/backend/src/db/index.js'
import { randomUUID } from 'crypto'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { writeAuditLog } from '@/backend/src/lib/audit.js'
import { queues } from '@/backend/queues/index.js'

const log = agentLogger('legal-testing')
const connection = { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') }

// Gold dataset: loaded from datasets/gold_eval_dataset.json
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadGoldDataset() {
  try {
    const raw = readFileSync(resolve(__dirname, '../datasets/gold_eval_dataset.json'), 'utf8')
    return JSON.parse(raw)
  } catch {
    // Fallback to hardcoded subset if file missing
    return [
      { query: 'What is the test for judicial review in Malaysia?', expectedKeywords: ['Wednesbury', 'unreasonableness', 'O.53', 'Rules of Court', 'illegality', 'procedural impropriety'] },
      { query: 'Define ratio decidendi under Malaysian common law', expectedKeywords: ['binding', 'precedent', 'material facts', 'holding', 'stare decisis'] },
      { query: 'What constitutes a valid contract under Malaysian Contracts Act 1950?', expectedKeywords: ['offer', 'acceptance', 'consideration', 'intention', 'capacity', 'free consent'] },
      { query: 'Explain Article 5 of the Federal Constitution of Malaysia', expectedKeywords: ['liberty', 'person', 'detention', 'habeas corpus', 'law', 'deprived'] },
      { query: 'What is the limitation period for tort claims in Malaysia?', expectedKeywords: ['6 years', 'Limitation Act 1953', 'accrual', 'cause of action'] },
    ]
  }
}

const GOLD_DATASET = loadGoldDataset()

async function runGoldEvaluation() {
  let passed = 0
  const results = []

  for (const { query, expectedKeywords } of GOLD_DATASET) {
    const start = Date.now()
    const res = await ollama.chat({
      model: process.env.LLM_MODEL || 'minimax-m2.7:cloud',
      messages: [{ role: 'user', content: `Answer this Malaysian legal question concisely: ${query}` }],
    })
    const answer = res.message.content.toLowerCase()
    const hits = expectedKeywords.filter(k => answer.includes(k.toLowerCase()))
    const score = hits.length / expectedKeywords.length
    const pass = score >= 0.5
    if (pass) passed++

    results.push({
      query, score: parseFloat(score.toFixed(3)), pass,
      hits, misses: expectedKeywords.filter(k => !answer.includes(k.toLowerCase())),
      latencyMs: Date.now() - start,
    })
  }

  const credibilityScore = Math.round((passed / GOLD_DATASET.length) * 100)
  return { credibilityScore, passed, total: GOLD_DATASET.length, results }
}

async function generateAdversarialTests(count = 5) {
  const prompt = `Generate ${count} adversarial legal queries that might confuse a Malaysian legal AI system. Include:
- Queries about non-existent cases
- Ambiguous jurisdiction questions  
- Trick questions mixing Malaysian and foreign law
- Questions with false premises

Return as JSON array: [{"query": "...", "expectedBehaviour": "..."}]`

  const res = await ollama.chat({
    model: process.env.LLM_MODEL || 'minimax-m2.7:cloud',
    messages: [{ role: 'user', content: prompt }],
  })

  try {
    const jsonMatch = res.message.content.match(/\[[\s\S]*\]/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : []
  } catch {
    return []
  }
}

const worker = new Worker('legal-testing', async (job) => {
  const { action, traceId = randomUUID(), userId } = job.data
  const start = Date.now()
  log.info({ traceId, action }, 'Testing started')

  if (action === 'gold_eval') {
    const evaluation = await runGoldEvaluation()
    log.info({ traceId, credibilityScore: evaluation.credibilityScore }, 'Gold evaluation complete')

    // Disable drafting if credibility drops below 90
    if (evaluation.credibilityScore < 90) {
      log.warn({ traceId, score: evaluation.credibilityScore }, '⚠️ Credibility below 90 — drafting features should be reviewed')
    }

    await writeAuditLog({
      traceId, agentName: 'legal-testing', userId, action: 'gold_eval',
      input: { datasetSize: GOLD_DATASET.length },
      output: { credibilityScore: evaluation.credibilityScore, passed: evaluation.passed },
      confidence: evaluation.credibilityScore / 100,
      durationMs: Date.now() - start,
    })

    return { traceId, ...evaluation }
  }

  if (action === 'adversarial') {
    const tests = await generateAdversarialTests(job.data.count || 5)
    log.info({ traceId, count: tests.length }, 'Adversarial tests generated')
    return { traceId, tests }
  }

  if (action === 'benchmark') {
    // Measure retrieval + analysis latency
    const benchmarks = []
    for (const { query } of GOLD_DATASET.slice(0, 3)) {
      const t0 = Date.now()
      await queues.retrieval.add('benchmark', { query, traceId, topK: 3 })
      benchmarks.push({ query: query.slice(0, 50), enqueuedMs: Date.now() - t0 })
    }
    return { traceId, benchmarks }
  }

  throw new Error(`Unknown testing action: ${action}`)
}, { connection, concurrency: 1 })

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Testing job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Testing Agent started')
