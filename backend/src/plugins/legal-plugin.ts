/**
 * LAW MATE Plugin
 * Registers server implementations for all legal tools,
 * backed by BullMQ queues. Import `legalTools` and spread
 * into any `chat({ tools: [...legalTools] })` call.
 */
import { randomUUID } from 'crypto'
import { prisma } from '../db/index.js'
import {
  legalRetrieveDef,
  legalAnalyseDef,
  legalDraftDef,
  legalValidateDef,
  legalDebateDef,
  legalPrivacyDef,
  legalAuditDef,
  legalOrchestrateDef,
  legalMonitorDef,
  legalIndexDef,
  legalTestDef,
} from '../tools/index.js'

async function getQueues() {
  const { queues } = await import('../../queues/index.js')
  return queues
}

// ── Tool 1: Retrieval (sync — queries pgvector directly) ─────────────────────
const legalRetrieve = legalRetrieveDef.server(async ({ query, topK = 5, court }) => {
  const traceId = randomUUID()

  const courtParam = court ?? null

  const rows = await prisma.$queryRawUnsafe(
    `
    SELECT id, "caseName", citation, content, court, "caseDate",
           1 - (vector <=> (
             SELECT vector FROM vector_docs
             WHERE content ILIKE $1 AND vector IS NOT NULL
             LIMIT 1
           )) AS similarity
    FROM vector_docs
    WHERE vector IS NOT NULL
      AND ($3::text IS NULL OR court = $3)
    ORDER BY similarity DESC
    LIMIT $2
  `,
    `%${query}%`,
    topK,
    court,
  ) as any[]


  return {
    traceId,
    cases: rows.map(r => ({
      citation: r.citation ?? '',
      content: (r.content ?? '').slice(0, 500),
      court: r.court ?? undefined,
      similarity: Number(r.similarity ?? 0),
    })),
  }
})

// ── Tool 2: Analysis ─────────────────────────────────────────────────────────
const legalAnalyse = legalAnalyseDef.server(async (input) => {
  const traceId = randomUUID()
  const queues = await getQueues()
  const job = await queues.analysis.add('analyse', { ...input, traceId })
  return { jobId: job.id!, traceId }
})

// ── Tool 3: Drafting ─────────────────────────────────────────────────────────
const legalDraft = legalDraftDef.server(async (input) => {
  const traceId = randomUUID()
  const queues = await getQueues()
  const job = await queues.drafting.add('draft', { ...input, traceId })
  return { jobId: job.id!, traceId }
})

// ── Tool 4: Validation ───────────────────────────────────────────────────────
const legalValidate = legalValidateDef.server(async (input) => {
  const traceId = randomUUID()
  const queues = await getQueues()
  const job = await queues.validation.add('validate', { ...input, traceId })
  return { jobId: job.id!, traceId }
})

// ── Tool 5: Debate ───────────────────────────────────────────────────────────
const legalDebate = legalDebateDef.server(async (input) => {
  const traceId = randomUUID()
  const queues = await getQueues()
  const job = await queues.debate.add('debate', { ...input, traceId })
  return { jobId: job.id!, traceId }
})

// ── Tool 6: Privacy ──────────────────────────────────────────────────────────
const legalPrivacy = legalPrivacyDef.server(async (input) => {
  const traceId = randomUUID()
  const queues = await getQueues()
  const job = await queues.privacy.add('privacy', { ...input, traceId })
  return { jobId: job.id!, traceId }
})

// ── Tool 7: Audit ────────────────────────────────────────────────────────────
const legalAudit = legalAuditDef.server(async (input) => {
  const traceId = randomUUID()
  const queues = await getQueues()
  const job = await queues.audit.add('audit', { ...input, traceId })
  return { jobId: job.id!, traceId }
})

// ── Tool 8: Orchestrate ──────────────────────────────────────────────────────
const legalOrchestrate = legalOrchestrateDef.server(async (input) => {
  const traceId = randomUUID()
  const queues = await getQueues()
  const job = await queues.orchestrator.add('full', { ...input, action: 'full', traceId })
  return { jobId: job.id!, traceId }
})

// ── Tool 9: Monitor ──────────────────────────────────────────────────────────
const legalMonitor = legalMonitorDef.server(async (input) => {
  const traceId = randomUUID()
  const queues = await getQueues()
  const job = await queues.monitoring.add('monitor', { ...input, traceId })
  return { jobId: job.id!, traceId }
})

// ── Tool 10: Index ───────────────────────────────────────────────────────────
const legalIndex = legalIndexDef.server(async (input) => {
  const traceId = randomUUID()
  const queues = await getQueues()
  const job = await queues.indexing.add('index', { ...input, traceId })
  return { jobId: job.id!, traceId }
})

// ── Tool 11: Test ────────────────────────────────────────────────────────────
const legalTest = legalTestDef.server(async (input) => {
  const traceId = randomUUID()
  const queues = await getQueues()
  const job = await queues.testing.add(input.action, { ...input, traceId })
  return { jobId: job.id!, traceId }
})

/** Drop-in array for `chat({ tools: legalTools })` */
export const legalTools = [
  legalRetrieve,
  legalAnalyse,
  legalDraft,
  legalValidate,
  legalDebate,
  legalPrivacy,
  legalAudit,
  legalOrchestrate,
  legalMonitor,
  legalIndex,
  legalTest,
]

/** Plugin metadata (OpenClaw-compatible) */
export const legalPlugin = {
  name: 'legal-ai-my',
  version: '1.1.0',
  description: 'LAW MATE — Full 11-tool suite: retrieval, analysis, drafting, validation, debate, privacy, audit, orchestration, monitoring, indexing, testing',
  tools: legalTools,
}
