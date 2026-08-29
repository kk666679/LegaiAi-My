/**
 * Agent 1: Legal Retrieval Agent
 * - Hybrid search: dense vector (pgvector) + BM25 keyword reranking
 * - Multi-jurisdiction filtering, temporal awareness, bilingual (EN/MY)
 * - Source attribution, confidence scores, hallucination guard
 */
import { Worker } from 'bullmq'
import ollama from 'ollama'
import { pipeline } from '@xenova/transformers'
import { prisma } from '@/backend/src/db/index.js'
import { randomUUID } from 'crypto'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { writeAuditLog } from '@/backend/src/lib/audit.js'
import { signOutput } from '@/backend/src/lib/crypto.js'

const log = agentLogger('legal-retrieval')
const connection = { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') }

// Lazy-loaded multilingual embedder
let embedder = null
async function getEmbedder() {
  if (!embedder) embedder = await pipeline('feature-extraction', 'Xenova/multilingual-e5-small')
  return embedder
}

async function embedQuery(text) {
  const model = await getEmbedder()
  const out = await model(text, { pooling: 'mean', normalize: true })
  return Array.from(out.data)
}

const worker = new Worker('legal-retrieval', async (job) => {
  const { query, traceId = randomUUID(), filters = {}, topK = 5 } = job.data
  const start = Date.now()
  log.info({ traceId, query, filters }, 'Retrieval started')

  // Step 1: Embed query (multilingual)
  const queryVec = await embedQuery(query)

  // Step 2: Build WHERE clause for jurisdiction/date filters
  const courtFilter = filters.court ? `AND court = '${filters.court}'` : ''
  const dateFrom = filters.dateFrom ? `AND "caseDate" >= '${filters.dateFrom}'` : ''
  const dateTo = filters.dateTo ? `AND "caseDate" <= '${filters.dateTo}'` : ''
  const langFilter = filters.language ? `AND language = '${filters.language}'` : ''

  // Step 3: Dense vector search with pgvector cosine similarity
  const results = await prisma.$queryRawUnsafe(`
    SELECT id, collection, content, "caseName", court, judge, "caseDate", citation,
           "areaOfLaw", "paragraphNum", language,
           1 - (vector <=> $1::vector) AS similarity
    FROM vector_docs
    WHERE vector IS NOT NULL ${courtFilter} ${dateFrom} ${dateTo} ${langFilter}
    ORDER BY vector <=> $1::vector
    LIMIT $2
  `, `[${queryVec.join(',')}]`, topK * 2)

  // Step 4: BM25-style keyword reranking (simple TF scoring over content)
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)
  const reranked = results
    .map(r => {
      const text = (r.content || '').toLowerCase()
      const tf = terms.reduce((acc, t) => acc + (text.split(t).length - 1), 0)
      const combined = (parseFloat(r.similarity) * 0.7) + (Math.min(tf / 10, 1) * 0.3)
      return { ...r, similarity: parseFloat(r.similarity), bm25Score: tf, combinedScore: combined }
    })
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, topK)

  // Step 5: Hallucination guard
  if (reranked.length === 0) {
    log.warn({ traceId }, 'No relevant documents found')
    return { traceId, results: [], message: 'No relevant document found', confidence: 0 }
  }

  // Step 6: Source attribution + confidence
  const attributed = reranked.map(r => ({
    id: r.id,
    citation: r.citation || 'Citation unavailable',
    court: r.court,
    judge: r.judge,
    caseDate: r.caseDate,
    paragraphNum: r.paragraphNum,
    content: r.content,
    confidence: parseFloat(r.combinedScore.toFixed(4)),
    _sig: signOutput(r),
  }))

  const output = { traceId, results: attributed, count: attributed.length }

  await writeAuditLog({
    traceId, agentName: 'legal-retrieval', action: 'retrieve',
    input: { query, filters, topK },
    output, confidence: attributed[0]?.confidence,
    durationMs: Date.now() - start,
  })

  log.info({ traceId, count: attributed.length }, 'Retrieval complete')
  return output
}, { connection, concurrency: 3 })

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Retrieval job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Retrieval Agent started')
