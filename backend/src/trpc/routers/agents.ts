import { z } from 'zod'
import { router, publicProcedure, protectedProcedure, permissionProcedure } from '../trpc'
import { queues } from '../../queues/index'
import { prisma } from '../../db'
import type { AnyRouter } from '@trpc/server'

const DRAFT_DOC_TYPES = z.enum([
  'WRIT', 'AFFIDAVIT', 'SUBMISSION', 'COMPLAINT',
  'STATEMENT_OF_CLAIM', 'DEFENCE', 'NOTICE_OF_APPEAL',
  'SKELETAL_ARGUMENTS', 'CONSENT_ORDER', 'SUMMONS', 'ENFORCEMENT_NOTICE',
])

export const agentsRouter: AnyRouter = router({

  // ── Agent 1: Retrieval ───────────────────────────────────────────────────
  retrieve: permissionProcedure('run_agents')
    .input(z.object({
      query: z.string(),
      filters: z.object({
        court: z.enum(['FEDERAL', 'APPEAL', 'HIGH', 'SESSIONS', 'MAGISTRATE']).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        language: z.enum(['en', 'ms']).optional(),
      }).default({}),
      topK: z.number().default(5),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await queues.retrieval.add('retrieve', { ...input, traceId: ctx.traceId })
      return { jobId: job.id, traceId: ctx.traceId }
    }),

  // ── Agent 2: Analysis ────────────────────────────────────────────────────
  analyse: permissionProcedure('run_agents')
    .input(z.object({
      task: z.string(),
      cases: z.array(z.object({
        id: z.string().optional(),
        citation: z.string().optional(),
        content: z.string().optional(),
        confidence: z.number().optional(),
      })).default([]),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await queues.analysis.add('analyse', { ...input, traceId: ctx.traceId })
      return { jobId: job.id, traceId: ctx.traceId }
    }),

  // ── Agent 3: Drafting ────────────────────────────────────────────────────
  draft: permissionProcedure('edit_document')
    .input(z.object({
      docType: DRAFT_DOC_TYPES,
      tone: z.enum(['adversarial', 'neutral', 'persuasive']).default('neutral'),
      format: z.enum(['markdown', 'docx', 'pdf']).default('markdown'),
      parties: z.object({
        plaintiff: z.string(),
        defendant: z.string(),
        court: z.string(),
        caseNumber: z.string().optional(),
      }),
      facts: z.string(),
      reliefSought: z.string().optional(),
      citations: z.array(z.string()).default([]),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await queues.drafting.add('draft', { ...input, traceId: ctx.traceId })
      return { jobId: job.id, traceId: ctx.traceId }
    }),

  // ── Agent 4: Validation ──────────────────────────────────────────────────
  validate: permissionProcedure('run_agents')
    .input(z.object({
      citation: z.string().optional(),
      text: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await queues.validation.add('validate', { ...input, traceId: ctx.traceId })
      return { jobId: job.id, traceId: ctx.traceId }
    }),

  // ── Agent 5: Audit actions ───────────────────────────────────────────────
  auditAction: permissionProcedure('view_audit_log')
    .input(z.object({
      action: z.enum(['legal_hold', 'forget_user', 'log']),
      caseId: z.string().optional(),
      userId: z.string().optional(),
      data: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await queues.audit.add('audit', { ...input, traceId: ctx.traceId })
      return { jobId: job.id, traceId: ctx.traceId }
    }),

  // ── Agent 6: Orchestrate full workflow ───────────────────────────────────
  orchestrate: permissionProcedure('run_agents')
    .input(z.object({
      query: z.string(),
      docType: DRAFT_DOC_TYPES.optional(),
      parties: z.object({
        plaintiff: z.string(),
        defendant: z.string(),
        court: z.string(),
        caseNumber: z.string().optional(),
      }).optional(),
      facts: z.string().optional(),
      citations: z.array(z.string()).default([]),
      proBono: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await queues.orchestrator.add('full', { ...input, action: 'full', traceId: ctx.traceId })
      return { jobId: job.id, traceId: ctx.traceId }
    }),

  // ── Agent 7: Privacy / PII ───────────────────────────────────────────────
  privacy: permissionProcedure('run_agents')
    .input(z.object({
      action: z.enum(['redact', 'set_consent', 'get_consent', 'minimise']),
      text: z.string().optional(),
      userId: z.string().optional(),
      parties: z.record(z.string(), z.string()).optional(),
      consentPrefs: z.object({
        allowLLM: z.boolean().optional(),
        allowDraft: z.boolean().optional(),
        dataRegion: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await queues.privacy.add('privacy', { ...input, traceId: ctx.traceId })
      return { jobId: job.id, traceId: ctx.traceId }
    }),

  // ── Agent 9: Debate ──────────────────────────────────────────────────────
  debate: permissionProcedure('run_agents')
    .input(z.object({
      problem: z.string(),
      citations: z.array(z.string()).default([]),
      rounds: z.number().default(2),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await queues.debate.add('debate', { ...input, traceId: ctx.traceId })
      return { jobId: job.id, traceId: ctx.traceId }
    }),

  // ── Agent 10: Monitoring / Alerts ────────────────────────────────────────
  monitor: protectedProcedure
    .input(z.object({
      action: z.enum(['subscribe', 'detect_trend', 'send_alert']),
      userId: z.string().optional(),
      topics: z.array(z.string()).optional(),
      series: z.array(z.number()).optional(),
      alert: z.object({
        title: z.string(),
        body: z.string().optional(),
        sourceUrl: z.string().optional(),
        confidence: z.number().default(0.95),
        topic: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await queues.monitoring.add('monitor', { ...input, traceId: ctx.traceId })
      return { jobId: job.id, traceId: ctx.traceId }
    }),

  // ── Agent 11: Indexing ───────────────────────────────────────────────────
  index: permissionProcedure('create_case')
    .input(z.object({
      collection: z.string(),
      documents: z.array(z.object({
        id: z.string().optional(),
        content: z.string(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        approvedBy: z.string().optional(),
      })),
      requireApproval: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await queues.indexing.add('index', { ...input, traceId: ctx.traceId })
      return { jobId: job.id, traceId: ctx.traceId }
    }),

  // ── Agent 12: Testing ────────────────────────────────────────────────────
  runGoldEval: permissionProcedure('manage_users')
    .mutation(async ({ ctx }) => {
      const job = await queues.testing.add('gold_eval', { action: 'gold_eval', traceId: ctx.traceId })
      return { jobId: job.id, traceId: ctx.traceId }
    }),

  runAdversarial: permissionProcedure('manage_users')
    .input(z.object({ count: z.number().default(5) }))
    .mutation(async ({ input, ctx }) => {
      const job = await queues.testing.add('adversarial', { action: 'adversarial', ...input, traceId: ctx.traceId })
      return { jobId: job.id, traceId: ctx.traceId }
    }),

  runBenchmark: permissionProcedure('manage_users')
    .mutation(async ({ ctx }) => {
      const job = await queues.testing.add('benchmark', { action: 'benchmark', traceId: ctx.traceId })
      return { jobId: job.id, traceId: ctx.traceId }
    }),

  // ── Data queries ─────────────────────────────────────────────────────────
  getAuditLogs: permissionProcedure('view_audit_log')
    .input(z.object({
      traceId: z.string().optional(),
      agentName: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return prisma.auditLog.findMany({
        where: {
          ...(input.traceId ? { traceId: input.traceId } : {}),
          ...(input.agentName ? { agentName: input.agentName } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      })
    }),

  indexStats: publicProcedure
    .query(async () => prisma.indexStats.findMany({ orderBy: { lastUpdated: 'desc' } })),

  queueHealth: publicProcedure
    .query(async () => {
      const health: Record<string, object> = {}
      for (const [name, q] of Object.entries(queues)) {
        health[name] = await (q as any).getJobCounts('waiting', 'active', 'delayed', 'failed')
      }
      const maxWaiting = Math.max(...Object.values(health).map((d: any) => d.waiting || 0))
      return { status: maxWaiting > 20 ? 'degraded' : 'healthy', queues: health, timestamp: new Date().toISOString() }
    }),
})
