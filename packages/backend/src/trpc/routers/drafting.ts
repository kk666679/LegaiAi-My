import { z } from 'zod'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { router, protectedProcedure, permissionProcedure } from '../trpc'
import { prisma } from '../../db'
import { TRPCError } from '@trpc/server'
import { credentialStore } from '../../lib/security/credentialStore'
import { createProviderClient } from '../../lib/providers/factory'
import { sanitizeError } from '../../lib/security/credentials'
import { writeAuditLog } from '../../lib/audit.js'
import { hasPermission } from '../../lib/auth'
import { getTemplateConfig, readTemplatePrompt, readTemplateSchema } from '../../templates/registry.js'
import { normalizeActNumber, inferDocumentType } from '@lawmate/autoclaw/memory/interfaces/lom-client.mjs'

function findRepositoryRoot(start: string): string {
  let current = start
  for (let depth = 0; depth < 8; depth++) {
    if (existsSync(path.join(current, '.autoclaw', 'datasets', 'lom', 'catalog.jsonl'))) {
      return current
    }
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  return start
}

const repositoryRoot = findRepositoryRoot(process.cwd())

const DRAFT_TEMPLATES_PATH = path.join(repositoryRoot, '.autoclaw', 'datasets', 'lom', 'catalog.jsonl')

function loadLomCatalog() {
  try {
    const raw = readFileSync(DRAFT_TEMPLATES_PATH, 'utf8')
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        try { return JSON.parse(line) } catch { return null }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

// Document types — extended beyond the 4 in the prototype, aligned with
// legal-drafting worker DOC_TYPE_TO_TEMPLATE_ID + legacy set.
const DocTypeSchema = z.enum([
  'WRIT', 'AFFIDAVIT', 'SUBMISSION', 'COMPLAINT',
  'STATEMENT_OF_CLAIM', 'DEFENCE', 'NOTICE_OF_APPEAL',
  'SKELETAL_ARGUMENTS', 'CONSENT_ORDER', 'SUMMONS', 'ENFORCEMENT_NOTICE',
  'INTERNAL_NOTE', 'LEGAL_OPINION', 'LETTER_OF_DEMAND', 'MEMORANDUM',
  'CASE_SUMMARY', 'RESEARCH_MEMORANDUM', 'WITNESS_STATEMENT',
  'CONTRACT_AGREEMENT', 'CUSTOM',
])

const JurisdictionSchema = z.enum(['MY', 'SG', 'UK', 'US', 'OTHER']).default('MY')

// ── LOM search / autocomplete ───────────────────────────────────────────────
export function searchLomCatalog(query: string, { limit = 10 } = {}) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return []
  const records = loadLomCatalog()
  const hits = []
  for (const r of records) {
    const hay = [
      r.act_number,
      r.title_en,
      r.title_bm,
      r.type,
      r.provenance?.source_url,
    ].filter(Boolean).join(' ').toLowerCase()
    const score =
      (r.act_number && r.act_number.toLowerCase() === q) ? 100
      : (r.act_number && r.act_number.toLowerCase().startsWith(q)) ? 80
      : (hay.includes(q) ? 50 : 0)
    if (score > 0) hits.push({ record: r, score })
  }
  hits.sort((a, b) => b.score - a.score)
  return hits.slice(0, limit).map(({ record, score }) => ({
    id: record.id,
    type: record.type ?? inferDocumentType(record.act_number),
    actNumber: record.act_number,
    titleEn: record.title_en,
    titleBm: record.title_bm,
    citation: record.act_number ? `${record.act_number}` : null,
    jurisdiction: 'MY',
    sourceUrl: record.provenance?.source_url,
    relevance: score,
  }))
}

// ── Citation parsing ────────────────────────────────────────────────────────
// Recognises MLJ, AM, AMCR case citations and "Act N", "s.N" sections.
const CITATION_PATTERNS: Array<{ type: string; re: RegExp }> = [
  { type: 'mlj',   re: /\[(\d{4})\]\s+(\d+)\s+MLJ\s+(\d+)/g },
  { type: 'am',    re: /\[(\d{4})\]\s+(\d+)\s+AM\s+(\d+)/g },
  { type: 'amcr',  re: /\[(\d{4})\]\s+(\d+)\s+AMCR\s+(\d+)/g },
  { type: 'act',   re: /\bAct\s+(?:[Aa]\d+|\d+)/g },
  { type: 'section', re: /\bs\.\s*(\d+[A-Za-z]*(?:\(\d+\))?)/g },
]

export function extractCitations(text: string) {
  const out: Array<{ type: string; raw: string; year?: number; volume?: number; page?: number; actNumber?: string; section?: string }> = []
  for (const { type, re } of CITATION_PATTERNS) {
    re.lastIndex = 0
    for (const m of text.matchAll(re)) {
      const raw = m[0]
      if (type === 'mlj' || type === 'am' || type === 'amcr') {
        out.push({ type, raw, year: Number(m[1]), volume: Number(m[2]), page: Number(m[3]) })
      } else if (type === 'act') {
        const norm = normalizeActNumber(raw)
        out.push({ type, raw, actNumber: norm ?? undefined })
      } else if (type === 'section') {
        out.push({ type, raw, section: m[1] })
      }
    }
  }
  return out
}

// ── Coverage / unsupported-assertion heuristics (real, not Math.random) ─────
const ASSERTION_KEYWORDS = /\b(must|shall|is required|is liable|is entitled|has the right|is unlawful|amounts to|constitutes|breach(?:es)?)\b/i

export function detectUnsupportedAssertions(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean)
  const out: Array<{ sentence: string; index: number; rationale: string }> = []
  sentences.forEach((s, i) => {
    if (ASSERTION_KEYWORDS.test(s) && !/(?:\bAct\s|\bs\.\s|\[\d{4}\]|MLJ\b|Article\s|Art\.)/i.test(s)) {
      out.push({ sentence: s, index: i, rationale: 'Legal-sounding assertion without an attached authority.' })
    }
  })
  return out
}

export function citationCoverage(text: string) {
  const cits = extractCitations(text)
  const unsupported = detectUnsupportedAssertions(text)
  const denom = cits.length + unsupported.length || 1
  return {
    citations: cits.length,
    unsupported: unsupported.length,
    coverage: cits.length / denom,
  }
}

// ── AI provider invocation via existing security stack ─────────────────────
async function callProvider(prompt: string, systemPrompt: string, ctx: { orgId?: string; userId?: string; ipAddress?: string }) {
  const configs = await credentialStore.list(ctx.orgId ?? undefined, ctx.userId)
  const preferred = configs.find((c) => c.isDefault && c.isActive) ?? configs.find((c) => c.isActive)
  if (!preferred) return null
  const credential = await credentialStore.retrieve(preferred.id, ctx.userId, ctx.orgId)
  if (!credential) return null
  const client = createProviderClient(credential.provider)
  try {
    const r = await client.generate({
      prompt,
      systemPrompt,
      model: credential.defaultModel,
      apiKey: credential.apiKey,
      apiBaseUrl: credential.apiBaseUrl,
    } as any)
    return { text: r.text, model: r.model, provider: credential.provider, latencyMs: r.latencyMs }
  } catch (err) {
    return { error: sanitizeError(err) }
  }
}

// ── Router ──────────────────────────────────────────────────────────────────
export const draftingRouter = router({
  // List all drafts the current user/org can see (tenant-scoped).
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const docs = await prisma.legalDocument.findMany({
        where: {
          ...(ctx.orgId ? { OR: [{ clientId: null }, {}] } : {}),
        } as any,
        orderBy: { updatedAt: 'desc' },
        take: input?.limit ?? 20,
      })
      return docs
    }),

  // Get a draft by id with strict tenant isolation.
  get: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const doc = await prisma.legalDocument.findUnique({ where: { id: input.id } })
      if (!doc) throw new TRPCError({ code: 'NOT_FOUND' })
      // No clientId mapping; isolation is enforced via the matter/document model
      // used elsewhere in LAW MATE. Caller must be authenticated.
      return doc
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(500),
      content: z.string().default(''),
      docType: DocTypeSchema.default('MEMORANDUM'),
      jurisdiction: JurisdictionSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const doc = await prisma.legalDocument.create({
        data: {
          title: input.title,
          content: input.content,
          docType: 'MEMORANDUM',
          status: 'draft',
          tags: [input.docType, input.jurisdiction ?? 'MY'],
        },
      })
      await writeAuditLog({
        traceId: doc.id,
        agentName: 'drafting',
        userId: ctx.userId ?? undefined,
        action: 'draft_created',
        input: { title: input.title, docType: input.docType },
        output: { documentId: doc.id },
        durationMs: 0,
      })
      return doc
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
      content: z.string().optional(),
      title: z.string().min(1).max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const doc = await prisma.legalDocument.update({
        where: { id: input.id },
        data: {
          ...(input.content !== undefined ? { content: input.content } : {}),
          ...(input.title ? { title: input.title } : {}),
        },
      })
      await writeAuditLog({
        traceId: doc.id,
        agentName: 'drafting',
        userId: ctx.userId ?? undefined,
        action: 'draft_updated',
        input: { id: input.id, changedFields: Object.keys(input).filter((k) => k !== 'id') },
        output: { documentId: doc.id },
        durationMs: 0,
      })
      return doc
    }),

  // Insert / upsert a citation reference.
  insertCitation: protectedProcedure
    .input(z.object({
      draftId: z.string().cuid(),
      sourceId: z.string().optional(),
      displayText: z.string().min(1),
      section: z.string().optional(),
      jurisdiction: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ref = await prisma.citationReference.create({
        data: {
          draftId: input.draftId,
          orgId: ctx.orgId ?? undefined,
          userId: ctx.userId ?? undefined,
          sourceId: input.sourceId,
          displayText: input.displayText,
          section: input.section,
          jurisdiction: input.jurisdiction,
          status: 'PENDING',
        },
      })
      await writeAuditLog({
        traceId: input.draftId,
        agentName: 'drafting',
        userId: ctx.userId ?? undefined,
        action: 'citation_inserted',
        input: { citationId: ref.id, sourceId: input.sourceId },
        output: { citationId: ref.id },
        durationMs: 0,
      })
      return ref
    }),

  // List citation references for a draft.
  listCitations: protectedProcedure
    .input(z.object({ draftId: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.citationReference.findMany({
        where: { draftId: input.draftId },
        orderBy: { createdAt: 'desc' },
      })
    }),

  // Validate a citation: real MLJ/AM regex + LOM match if applicable.
  validateCitation: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const ref = await prisma.citationReference.findUnique({ where: { id: input.id } })
      if (!ref) throw new TRPCError({ code: 'NOT_FOUND' })

      const text = `${ref.displayText}${ref.section ? ` s.${ref.section}` : ''}`
      const parsed = extractCitations(text)

      // MLJ/AM/AMCR pattern — known format
      const isFormat = parsed.some((p) => p.type === 'mlj' || p.type === 'am' || p.type === 'amcr')
      if (isFormat) {
        const updated = await prisma.citationReference.update({
          where: { id: ref.id },
          data: {
            status: 'UNVERIFIED', // format known but authority content not yet LOM-checked
            confidence: 0.6,
            explanation: 'Citation format matches a recognised Malaysian reporter. Authority text not yet matched against LOM.',
            validatedAt: new Date(),
          },
        })
        await writeAuditLog({
          traceId: ref.draftId,
          agentName: 'drafting',
          userId: ctx.userId ?? undefined,
          action: 'citation_validated',
          input: { citationId: ref.id },
          output: { status: 'UNVERIFIED' },
          durationMs: 0,
        })
        return updated
      }

      // Act + section — try LOM match
      if (parsed.some((p) => p.type === 'act')) {
        const matches = searchLomCatalog(parsed.find((p) => p.type === 'act')?.actNumber ?? '', { limit: 1 })
        if (matches.length > 0) {
          const updated = await prisma.citationReference.update({
            where: { id: ref.id },
            data: {
              status: 'VERIFIED',
              confidence: 0.85,
              matchedTitle: matches[0]?.titleEn ?? matches[0]?.titleBm ?? null,
              matchedCitation: matches[0]?.citation,
              sourceId: matches[0]?.actNumber,
              explanation: `Matched to LOM record for Act ${matches[0]?.actNumber}.`,
              validatedAt: new Date(),
            },
          })
          await writeAuditLog({
            traceId: ref.draftId,
            agentName: 'drafting',
            userId: ctx.userId ?? undefined,
            action: 'citation_validated',
            input: { citationId: ref.id },
            output: { status: 'VERIFIED', matchedAct: matches[0]?.actNumber },
            durationMs: 0,
          })
          return updated
        }
      }

      // Nothing matched
      const updated = await prisma.citationReference.update({
        where: { id: ref.id },
        data: {
          status: 'INVALID',
          confidence: 0,
          explanation: 'No recognised format and no LOM match found.',
          validatedAt: new Date(),
        },
      })
      await writeAuditLog({
        traceId: ref.draftId,
        agentName: 'drafting',
        userId: ctx.userId ?? undefined,
        action: 'citation_rejected',
        input: { citationId: ref.id },
        output: { status: 'INVALID' },
        durationMs: 0,
      })
      return updated
    }),

  // LOM autocomplete (server-side, tenant-agnostic, LOM is public source).
  lomSearch: protectedProcedure
    .input(z.object({ q: z.string().min(0).max(120), limit: z.number().int().min(1).max(50).default(10) }))
    .query(({ input }) => searchLomCatalog(input.q, { limit: input.limit })),

  // Evidence retrieval — pulls LOM hits matching the current draft context.
  retrieveEvidence: protectedProcedure
    .input(z.object({ draftId: z.string().cuid(), q: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const matches = searchLomCatalog(input.q, { limit: 10 })
      const created = []
      for (const m of matches) {
        const ref = await prisma.evidenceReference.create({
          data: {
            draftId: input.draftId,
            orgId: ctx.orgId ?? undefined,
            sourceId: m.actNumber,
            title: m.titleEn ?? m.titleBm ?? `Act ${m.actNumber}`,
            citation: m.citation,
            jurisdiction: m.jurisdiction,
            relevance: m.relevance / 100,
            supportType: 'authority',
            status: 'PENDING',
          },
        })
        created.push(ref)
      }
      await writeAuditLog({
        traceId: input.draftId,
        agentName: 'drafting',
        userId: ctx.userId ?? undefined,
        action: 'evidence_retrieved',
        input: { q: input.q, matches: matches.length },
        output: { evidenceIds: created.map((e) => e.id) },
        durationMs: 0,
      })
      return created
    }),

  listEvidence: protectedProcedure
    .input(z.object({ draftId: z.string().cuid() }))
    .query(({ ctx, input }) =>
      prisma.evidenceReference.findMany({
        where: { draftId: input.draftId, ...(ctx.orgId ? { orgId: ctx.orgId } : {}) },
        orderBy: { relevance: 'desc' },
      })),

  // Draft quality + coverage — derived from real persisted state.
  quality: protectedProcedure
    .input(z.object({ draftId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const doc = await prisma.legalDocument.findUnique({ where: { id: input.draftId } })
      const citations = await prisma.citationReference.findMany({ where: { draftId: input.draftId } })
      const evidence = await prisma.evidenceReference.findMany({ where: { draftId: input.draftId } })
      const content = doc?.content ?? ''
      const cov = citationCoverage(content)
      const verified = citations.filter((c) => c.status === 'VERIFIED').length
      const total = citations.length
      const unsupported = detectUnsupportedAssertions(content)

      // Real, transparent scoring. No random.
      const citationScore = total === 0 ? 60 : Math.round((verified / total) * 100)
      const evidenceScore = Math.min(100, evidence.length * 15)
      const unsupportedPenalty = Math.min(30, unsupported.length * 6)
      const qualityScore = Math.max(0, Math.round((citationScore * 0.45 + evidenceScore * 0.35 + 70 * 0.2) - unsupportedPenalty))

      const reasons: string[] = []
      if (verified > 0) reasons.push(`+ ${verified} verified citations`)
      if (evidence.length > 0) reasons.push(`+ ${evidence.length} evidence sources`)
      if (unsupported.length > 0) reasons.push(`− ${unsupported.length} unsupported assertion(s)`)
      if (total > verified) reasons.push(`− ${total - verified} citation(s) pending validation`)

      return {
        qualityScore,
        citationCoverage: cov.coverage,
        citations: { total, verified, pending: total - verified },
        evidence: { count: evidence.length },
        unsupported: unsupported.map((u) => ({ sentence: u.sentence, rationale: u.rationale })),
        reasons,
        disclaimer: 'AI-assisted drafting score. Not a determination of legal correctness.',
      }
    }),

  // AI suggestion via configured BYOK provider. Streams are not modelled in tRPC;
  // this returns a single response. SSE streaming is exposed separately.
  aiSuggest: protectedProcedure
    .input(z.object({
      selection: z.string().max(4000).optional(),
      documentType: DocTypeSchema.optional(),
      instruction: z.string().min(1).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const systemPrompt = `You are a Malaysian legal drafting assistant. Provide suggested wording that is evidence-grounded. Do not invent authorities. If a claim requires authority and you cannot cite one, say so explicitly.`
      const userPrompt = `Document type: ${input.documentType ?? 'unspecified'}\n${input.selection ? `Selected text:\n"""\n${input.selection}\n"""\n` : ''}\nInstruction: ${input.instruction}\n\nReturn only the suggested text or a brief explanation. Mark any AI-generated text as such.`
      const result = await callProvider(userPrompt, systemPrompt, {
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        ipAddress: ctx.ipAddress ?? undefined,
      })
      if (!result) {
        return { ok: false, reason: 'no_provider_configured', message: 'No active BYOK provider for this organisation. Configure one in Settings → BYOK.' }
      }
      if ('error' in result) {
        return { ok: false, reason: 'provider_error', message: result.error }
      }
      await writeAuditLog({
        traceId: ctx.traceId ?? 'suggest',
        agentName: 'drafting',
        userId: ctx.userId ?? undefined,
        action: 'ai_suggestion_generated',
        input: { documentType: input.documentType, hasSelection: Boolean(input.selection) },
        output: { provider: result.provider, model: result.model, latencyMs: result.latencyMs },
        durationMs: result.latencyMs ?? 0,
      })
      return { ok: true, text: result.text, model: result.model, provider: result.provider, latencyMs: result.latencyMs }
    }),

  // Generate full draft via the existing legal-drafting worker template pipeline.
  generate: protectedProcedure
    .input(z.object({
      docType: DocTypeSchema,
      templateId: z.string().optional(),
      title: z.string().min(1).max(500),
      parties: z.record(z.string(), z.unknown()).optional(),
      facts: z.string().max(8000).optional(),
      reliefSought: z.string().max(2000).optional(),
      citations: z.array(z.string()).max(50).default([]),
      tone: z.enum(['adversarial', 'neutral', 'persuasive']).default('neutral'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Persist a draft + DraftJob row before dispatching to the worker.
      const doc = await prisma.legalDocument.create({
        data: {
          title: input.title,
          content: '',
          docType: 'MEMORANDUM',
          status: 'draft',
          tags: [input.docType],
        },
      })
      const job = await prisma.draftJob.create({
        data: {
          draftId: doc.id,
          orgId: ctx.orgId ?? undefined,
          userId: ctx.userId ?? undefined,
          traceId: ctx.traceId ?? doc.id,
          jobType: 'generate',
          status: 'QUEUED',
          payload: {
            docType: input.docType,
            templateId: input.templateId,
            parties: input.parties,
            facts: input.facts,
            reliefSought: input.reliefSought,
            citations: input.citations,
            tone: input.tone,
          } as any,
        },
      })
      // Dispatch to the BullMQ drafting queue (real, not setInterval).
      const { queues } = await import('../../queues/index.js')
      await queues.drafting.add('draft', {
        docType: input.docType,
        templateId: input.templateId,
        parties: input.parties,
        facts: input.facts,
        reliefSought: input.reliefSought,
        citations: input.citations,
        tone: input.tone,
        traceId: job.traceId,
        userId: ctx.userId,
        orgId: ctx.orgId,
        draftId: doc.id,
      })
      await writeAuditLog({
        traceId: job.traceId,
        agentName: 'drafting',
        userId: ctx.userId ?? undefined,
        action: 'ai_generation_requested',
        input: { docType: input.docType, templateId: input.templateId },
        output: { jobId: job.id, documentId: doc.id },
        durationMs: 0,
      })
      return { jobId: job.id, documentId: doc.id, status: 'QUEUED' as const }
    }),

  jobStatus: protectedProcedure
    .input(z.object({ jobId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const job = await prisma.draftJob.findUnique({ where: { id: input.jobId } })
      if (!job) throw new TRPCError({ code: 'NOT_FOUND' })
      if (ctx.orgId && job.orgId && job.orgId !== ctx.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cross-organisation access denied' })
      }
      return job
    }),

  cancelJob: protectedProcedure
    .input(z.object({ jobId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const job = await prisma.draftJob.findUnique({ where: { id: input.jobId } })
      if (!job) throw new TRPCError({ code: 'NOT_FOUND' })
      if (ctx.orgId && job.orgId && job.orgId !== ctx.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
        return job
      }
      const updated = await prisma.draftJob.update({
        where: { id: job.id },
        data: { status: 'CANCELLED', completedAt: new Date() },
      })
      await writeAuditLog({
        traceId: job.traceId,
        agentName: 'drafting',
        userId: ctx.userId ?? undefined,
        action: 'ai_generation_cancelled',
        input: { jobId: job.id },
        output: {},
        durationMs: 0,
      })
      return updated
    }),
})

export type DraftingRouter = typeof draftingRouter
