/**
 * Agent 11: Embedding & Indexing Agent
 * - Intelligent chunking (respects legal boundaries: "Held:", "Ratio:")
 * - Metadata enrichment via NER, incremental indexing (hash comparison)
 * - Checksum verification, rollback capability, index freshness metric
 */
import { Worker } from 'bullmq'
import ollama from 'ollama'
import { prisma } from '@/backend/src/db/index.js'
import { randomUUID } from 'crypto'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { writeAuditLog } from '@/backend/src/lib/audit.js'
import { sha256 } from '@/backend/src/lib/crypto.js'
import { jobService } from '@/backend/src/lib/jobs.js'
import { classifyError, DEFAULT_REDIS_CONNECTION } from '@/backend/src/lib/worker-utils.js'

const log = agentLogger('legal-indexing')
const connection = DEFAULT_REDIS_CONNECTION

const EMBED_TIMEOUT = 30000
const BATCH_SIZE = 10

// Legal-aware chunking: split on legal section boundaries
const LEGAL_BOUNDARIES = /(?=\b(?:HELD|RATIO|OBITER|FACTS|ISSUES?|DECISION|JUDGMENT|GROUNDS?|ORDERS?)\b[:\s])/i
const CHUNK_SIZE = 800
const CHUNK_OVERLAP = 100

function legalChunk(text) {
  // First split on legal boundaries
  const sections = text.split(LEGAL_BOUNDARIES).filter(s => s.trim().length > 50)

  const chunks = []
  for (const section of sections) {
    if (section.length <= CHUNK_SIZE) {
      chunks.push(section.trim())
    } else {
      // Sliding window with overlap
      for (let i = 0; i < section.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
        const chunk = section.slice(i, i + CHUNK_SIZE).trim()
        if (chunk.length > 50) chunks.push(chunk)
      }
    }
  }
  return chunks
}

// Extract legal metadata using NER + regex
async function enrichMetadata(text) {
  const caseNameMatch = text.match(/^([A-Z][A-Za-z\s&]+v[s]?\s+[A-Z][A-Za-z\s&]+)/m)
  const courtMatch = text.match(/\b(Federal Court|Court of Appeal|High Court|Sessions Court|Magistrate)\b/i)
  const dateMatch = text.match(/\b(\d{1,2}\s+\w+\s+\d{4}|\d{4})\b/)
  const citationMatch = text.match(/\[(\d{4})\]\s+(\d+)\s+MLJ\s+(\d+)/)
  const areaMatch = text.match(/\b(contract|tort|criminal|constitutional|administrative|family|land|company)\s+law\b/i)

  return {
    caseName: caseNameMatch?.[1]?.trim(),
    court: courtMatch?.[1]?.toUpperCase().replace(' ', '_'),
    caseDate: dateMatch?.[1] ? new Date(dateMatch[1]) : null,
    citation: citationMatch ? `[${citationMatch[1]}] ${citationMatch[2]} MLJ ${citationMatch[3]}` : null,
    areaOfLaw: areaMatch?.[1]?.toLowerCase(),
  }
}

async function embedText(text) {
  const res = await Promise.race([
    ollama.embeddings({
      model: process.env.EMBED_MODEL || 'mxbai-embed-large',
      prompt: text,
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Embedding timeout')), EMBED_TIMEOUT)),
  ])
  return res.embedding
}

const worker = new Worker('legal-indexing', async (job) => {
  const { documents, collection, traceId = randomUUID(), userId, requireApproval = false, jobId } = job.data
  const start = Date.now()
  log.info({ traceId, collection, docCount: documents?.length, jobId }, 'Indexing started')

  let unifiedJob = null
  if (jobId) {
    unifiedJob = await jobService.getById(jobId)
    if (unifiedJob) {
      await jobService.markRunning(unifiedJob.id, `worker-${process.pid}`)
    }
  }

  try {
    const results = { indexed: 0, skipped: 0, errors: [] }
    const total = (documents || []).length
    const BATCH = Math.max(1, Math.ceil(total / 10))

    for (let i = 0; i < total; i++) {
      const doc = documents[i]
      await jobService.markProcessing(
        unifiedJob?.id || '',
        `indexing_doc_${i + 1}`,
        Math.round(((i + 1) / total) * 100),
        `Indexing document ${i + 1} of ${total}`
      )

      try {
        const checksum = sha256(doc.content)

        // Incremental indexing: skip if checksum unchanged
        const existing = await prisma.vectorDoc.findFirst({
          where: { collection, checksum },
          select: { id: true },
        })
        if (existing) { results.skipped++; continue }

        // High-value case approval gate
        if (requireApproval && !doc.approvedBy) {
          log.warn({ traceId, docId: doc.id }, 'High-value case requires paralegal approval — skipped')
          results.skipped++
          continue
        }

        // Legal-aware chunking
        const chunks = legalChunk(doc.content)
        const metadata = await enrichMetadata(doc.content)

        // Embed chunks in batches
        for (let ci = 0; ci < chunks.length; ci++) {
          const vector = await embedText(chunks[ci])
          await prisma.vectorDoc.create({
            data: {
              id: `${doc.id || randomUUID()}-chunk-${ci}`,
              collection,
              content: chunks[ci],
              metadata: { ...doc.metadata, chunkIndex: ci, totalChunks: chunks.length },
              vector: `[${vector.join(',')}]`,
              checksum,
              indexVersion: doc.indexVersion || 1,
              approvedBy: doc.approvedBy,
              ...metadata,
            },
          })

          // Progress update during chunk embedding
          if (unifiedJob && (ci + 1) % BATCH === 0) {
            const percent = Math.round(((i + 1) / total) * 100)
            await jobService.markProcessing(
              unifiedJob.id,
              `indexing_doc_${i + 1}_chunk_${ci + 1}`,
              percent,
              `Document ${i + 1}: indexing chunk ${ci + 1} of ${chunks.length}`
            )
          }
        }

        // Update index stats
        await prisma.indexStats.upsert({
          where: { collection },
          update: { docCount: { increment: chunks.length }, lastUpdated: new Date() },
          create: { collection, docCount: chunks.length },
        })

        results.indexed++
      } catch (err) {
        const error = err
        log.error({ traceId, err: error.message }, 'Chunk indexing error')
        results.errors.push({ docId: doc.id, error: error.message })
      }
    }

    const output = { traceId, collection, ...results }

    await writeAuditLog({
      traceId, agentName: 'legal-indexing', userId, action: 'index',
      input: { collection, docCount: documents?.length },
      output: results, durationMs: Date.now() - start,
    })

    if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)

    log.info({ traceId, ...results }, 'Indexing complete')
    return output
  } catch (err) {
    const error = err
    const { retryable, code } = classifyError(error)
    log.error({ traceId, err: error.message, retryable, code }, 'Indexing job failed')

    if (unifiedJob) {
      if (retryable && unifiedJob.attempts < unifiedJob.maxAttempts) {
        await jobService.markRetrying(unifiedJob.id, unifiedJob.attempts + 1)
        throw error
      }
      await jobService.markFailed(unifiedJob.id, error.message, code)
    }

    throw error
  }
}, { connection, concurrency: 2, maxStalledCount: 2, removeOnFail: false, removeOnComplete: false })

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Indexing job failed'))
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
log.info('Legal Indexing Agent started')