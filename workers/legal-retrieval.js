/**
 * Agent 1: Legal Retrieval Agent
 * - Hybrid search: dense vector (pgvector) + BM25 keyword reranking
 * - Multi-jurisdiction filtering, temporal awareness, bilingual (EN/MY)
 * - Source attribution, confidence scores, hallucination guard
 */
import { Worker } from 'bullmq'
import ollama from 'ollama'
import { prisma } from '@/backend/src/db/index.js'
import { randomUUID } from 'crypto'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { writeAuditLog } from '@/backend/src/lib/audit.js'
import { signOutput } from '@/backend/src/lib/crypto.js'
import { runHybridRetrieval } from '../.autoclaw/agents/retrieval/hybrid-retriever.js'

const log = agentLogger('legal-retrieval')
const connection = { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') }

async function embedQuery(text) {
  const res = await ollama.embeddings({ model: process.env.EMBED_MODEL || 'mxbai-embed-large', prompt: text })
  return res.embedding
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

  // Step 4: Legal hybrid reranking (semantic vector + bilingual keyword + citation-aware scoring)
  const hybridDocuments = results.map(r => ({
    id: r.id,
    title: r.caseName || r.citation || 'Untitled case',
    caseName: r.caseName || '',
    citation: r.citation || '',
    content: r.content || '',
    sourceType: 'case',
    jurisdiction: 'MY',
    language: r.language || 'en',
    version: 'current',
    date: r.caseDate || null,
    authorityScore: parseFloat(r.similarity || 0),
    metadata: { id: r.id, collection: r.collection || 'vector_docs' },
  }))

  const hybrid = runHybridRetrieval(hybridDocuments, query, { filters, topK })
  const reranked = hybrid.results
    .map(hit => {
      const exact = results.find(r => String(r.id) === String(hit.id))
      return {
        ...(exact || {}),
        id: hit.id,
        citation: hit.citation || exact?.citation || 'Citation unavailable',
        title: hit.title || exact?.caseName || 'Untitled case',
        similarity: Number(hit.relevanceScore ?? hit.authorityScore ?? exact?.similarity ?? 0),
        bm25Score: Number(hit.relevanceScore ?? 0),
        combinedScore: Number(hit.relevanceScore ?? hit.authorityScore ?? 0),
      }
    })
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
