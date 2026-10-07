import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure, protectedProcedure, permissionProcedure } from '../trpc'
import { queues } from '../../queues/index'
import { prisma } from '../../db'
import { jobService } from '../../lib/jobs'
import { JobType } from '@prisma/client'
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
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: ctx.traceId,
        jobType: JobType.RETRIEVAL,
        input: input as any,
      })
      const bullJob = await queues.retrieval.add('retrieve', { ...input, traceId: ctx.traceId, jobId: job.id })
      return { jobId: job.id, traceId: ctx.traceId, bullJobId: bullJob.id }
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
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: ctx.traceId,
        jobType: JobType.ANALYSIS,
        input: input as any,
      })
      const bullJob = await queues.analysis.add('analyse', { ...input, traceId: ctx.traceId, jobId: job.id })
      return { jobId: job.id, traceId: ctx.traceId, bullJobId: bullJob.id }
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
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: ctx.traceId,
        jobType: JobType.DRAFTING,
        input: input as any,
      })
      const bullJob = await queues.drafting.add('draft', { ...input, traceId: ctx.traceId, jobId: job.id })
      return { jobId: job.id, traceId: ctx.traceId, bullJobId: bullJob.id }
    }),

  // ── Agent 4: Validation ──────────────────────────────────────────────────
  validate: permissionProcedure('run_agents')
    .input(z.object({
      citation: z.string().optional(),
      text: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: ctx.traceId,
        jobType: JobType.VALIDATION,
        input: input as any,
      })
      const bullJob = await queues.validation.add('validate', { ...input, traceId: ctx.traceId, jobId: job.id })
      return { jobId: job.id, traceId: ctx.traceId, bullJobId: bullJob.id }
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
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: ctx.traceId,
        jobType: JobType.AUDIT,
        input: input as any,
      })
      const bullJob = await queues.audit.add('audit', { ...input, traceId: ctx.traceId, jobId: job.id })
      return { jobId: job.id, traceId: ctx.traceId, bullJobId: bullJob.id }
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
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: ctx.traceId,
        jobType: JobType.ORCHESTRATOR,
        input: input as any,
      })
      const bullJob = await queues.orchestrator.add('full', { ...input, action: 'full', traceId: ctx.traceId, jobId: job.id })
      return { jobId: job.id, traceId: ctx.traceId, bullJobId: bullJob.id }
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
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: ctx.traceId,
        jobType: JobType.PRIVACY,
        input: input as any,
      })
      const bullJob = await queues.privacy.add('privacy', { ...input, traceId: ctx.traceId, jobId: job.id })
      return { jobId: job.id, traceId: ctx.traceId, bullJobId: bullJob.id }
    }),

  // ── Agent 9: Debate ──────────────────────────────────────────────────────
  debate: permissionProcedure('run_agents')
    .input(z.object({
      problem: z.string().trim().min(10).max(10000),
      citations: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
      rounds: z.number().int().min(1).max(4).default(2),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: ctx.traceId,
        jobType: JobType.DEBATE,
        input: input as any,
      })
      const bullJob = await queues.debate.add('debate', {
        ...input,
        traceId: ctx.traceId,
        userId: ctx.user.id,
        jobId: job.id,
      })
      return { jobId: job.id, traceId: ctx.traceId, bullJobId: bullJob.id }
    }),

  debateStatus: permissionProcedure('run_agents')
    .input(z.object({ jobId: z.string().min(1).max(256) }))
    .query(async ({ input, ctx }) => {
      const job = await jobService.getById(input.jobId)
      if (!job || job.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate job not found' })
      }
      return {
        id: job.id,
        status: job.status,
        result: job.status === 'COMPLETED' ? job.result : null,
        progress: job.progress,
        errorMessage: job.errorMessage,
      }
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
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: ctx.traceId,
        jobType: JobType.MONITORING,
        input: input as any,
      })
      const bullJob = await queues.monitoring.add('monitor', { ...input, traceId: ctx.traceId, jobId: job.id })
      return { jobId: job.id, traceId: ctx.traceId, bullJobId: bullJob.id }
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
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: ctx.traceId,
        jobType: JobType.INDEXING,
        input: input as any,
      })
      const bullJob = await queues.indexing.add('index', { ...input, traceId: ctx.traceId, jobId: job.id })
      return { jobId: job.id, traceId: ctx.traceId, bullJobId: bullJob.id }
    }),

  // ── Agent 12: Testing ────────────────────────────────────────────────────
  runGoldEval: permissionProcedure('manage_users')
    .mutation(async ({ ctx }) => {
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: ctx.traceId,
        jobType: JobType.TESTING,
        input: { action: 'gold_eval' } as any,
      })
      const bullJob = await queues.testing.add('gold_eval', { action: 'gold_eval', traceId: ctx.traceId, jobId: job.id })
      return { jobId: job.id, traceId: ctx.traceId, bullJobId: bullJob.id }
    }),

  runAdversarial: permissionProcedure('manage_users')
    .input(z.object({ count: z.number().default(5) }))
    .mutation(async ({ input, ctx }) => {
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: ctx.traceId,
        jobType: JobType.TESTING,
        input: { action: 'adversarial', count: input.count } as any,
      })
      const bullJob = await queues.testing.add('adversarial', { action: 'adversarial', ...input, traceId: ctx.traceId, jobId: job.id })
      return { jobId: job.id, traceId: ctx.traceId, bullJobId: bullJob.id }
    }),

  runBenchmark: permissionProcedure('manage_users')
    .mutation(async ({ ctx }) => {
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: ctx.traceId,
        jobType: JobType.TESTING,
        input: { action: 'benchmark' } as any,
      })
      const bullJob = await queues.testing.add('benchmark', { action: 'benchmark', traceId: ctx.traceId, jobId: job.id })
      return { jobId: job.id, traceId: ctx.traceId, bullJobId: bullJob.id }
    }),

  // ── Agent 13: Vercel Sandbox — safe code execution ───────────────────────
  sandboxExec: permissionProcedure('manage_users')
    .input(z.object({
      language: z.enum(['node', 'python', 'bash', 'shell']).default('node'),
      code: z.string().max(200_000).optional(),
      cmd: z.string().max(1024).optional(),
      args: z.array(z.string().max(1024)).max(64).optional(),
      cwd: z.string().optional(),
      env: z.record(z.string(), z.string()).optional(),
      sandboxName: z.string().regex(/^[a-z0-9][a-z0-9-_]*$/).optional(),
      files: z.array(z.object({
        path: z.string(),
        contentBase64: z.string(),
        mode: z.number().int().min(0).max(0o7777).optional(),
      })).max(100).optional(),
      networkPolicy: z.enum(['allow-all', 'deny-all']).default('deny-all'),
      vcpus: z.number().int().min(1).max(32).default(2),
      snapshotAfter: z.boolean().default(false),
      stopAfter: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: ctx.traceId,
        jobType: JobType.SANDBOX,
        input: input as any,
      })
      const bullJob = await queues.sandbox.add('exec', { ...input, traceId: ctx.traceId, userId: ctx.userId, orgId: ctx.orgId, jobId: job.id })
      return { jobId: job.id, traceId: ctx.traceId, bullJobId: bullJob.id }
    }),

  // ── Job status queries ───────────────────────────────────────────────────
  jobStatus: permissionProcedure('run_agents')
    .input(z.object({ jobId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const job = await prisma.job.findUnique({ where: { id: input.jobId } })
      if (!job) throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' })
      if (ctx.orgId && job.orgId && job.orgId !== ctx.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cross-organisation access denied' })
      }
      if (ctx.userId && job.userId && job.userId !== ctx.userId && ctx.orgId !== job.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }
      return job
    }),

  jobProgress: permissionProcedure('run_agents')
    .input(z.object({ jobId: z.string().cuid() }))
    .subscription(async function* ({ ctx, input }) {
      const job = await prisma.job.findUnique({ where: { id: input.jobId } })
      if (!job) throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' })
      if (ctx.orgId && job.orgId && job.orgId !== ctx.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      let lastUpdate = JSON.stringify(job.progress)
      yield job.progress ?? { stage: job.status.toLowerCase(), percent: 0, message: job.status, timestamp: new Date().toISOString() }

      const interval = setInterval(async () => {
        const current = await prisma.job.findUnique({ where: { id: input.jobId } })
        if (!current) return
        const update = JSON.stringify(current.progress)
        if (update !== lastUpdate) {
          lastUpdate = update
          yield current.progress ?? { stage: current.status.toLowerCase(), percent: 0, message: current.status, timestamp: new Date().toISOString() }
        }
      }, 1000)

      return () => clearInterval(interval)
        }),

  cancelJob: permissionProcedure('run_agents')
    .input(z.object({ jobId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const job = await prisma.job.findUnique({ where: { id: input.jobId } })
      if (!job) throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' })
      if (ctx.orgId && job.orgId && job.orgId !== ctx.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
        return job
      }
      await jobService.markCancelled(job.id)

      // Also try to remove from BullMQ
      try {
        const queueName = JOB_TYPE_TO_QUEUE_ARRAY[job.jobType]
        const queue = queueName && queues[queueName]
        if (queue) {
          const bullJob = await queue.getJob(job.id)
          if (bullJob) await bullJob.remove()
        }
      } catch (err) {
        log.warn({ err: (err as Error).message, jobId: job.id }, 'Failed to remove BullMQ job')
      }

      return prisma.job.findUnique({ where: { id: job.id } })
    }),

  retryJob: permissionProcedure('run_agents')
    .input(z.object({ jobId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const job = await prisma.job.findUnique({ where: { id: input.jobId } })
      if (!job) throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' })
      if (ctx.orgId && job.orgId && job.orgId !== ctx.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      if (job.attempts >= job.maxAttempts) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Max attempts reached' })
      }

      const updated = await jobService.retry(job.id)

      // Re-dispatch to queue
      try {
        const queueName = JOB_TYPE_TO_QUEUE_ARRAY[job.jobType]
        const queue = queueName && queues[queueName]
        if (queue) {
          await queue.add('retry', { ...(job.input as any), traceId: job.traceId, jobId: job.id }, { jobId: job.id })
        }
      } catch (err) {
        log.error({ err: (err as Error).message, jobId: job.id }, 'Failed to re-dispatch job')
      }

      return updated
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

  // ── Worker monitoring ────────────────────────────────────────────────────
  workerStats: permissionProcedure('manage_users')
    .query(async () => {
      const health: Record<string, any> = {}
      for (const [name, q] of Object.entries(queues)) {
        health[name] = await (q as any).getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed')
      }

      const dbJobs = await prisma.job.groupBy({
        by: ['jobType'],
        where: { status: { in: ['QUEUED', 'RUNNING', 'PROCESSING'] } },
        _count: { id: true },
      })

      const stats = await jobService.getStats(undefined)

      return {
        queues: health,
        dbJobs,
        dbStats: stats,
        timestamp: new Date().toISOString(),
      }
    }),
})

const JOB_TYPE_TO_QUEUE_ARRAY: Record<JobType, string> = {
  RETRIEVAL: 'retrieval',
  ANALYSIS: 'analysis',
  DRAFTING: 'drafting',
  VALIDATION: 'validation',
  AUDIT: 'audit',
  ORCHESTRATOR: 'orchestrator',
  PRIVACY: 'privacy',
  DEBATE: 'debate',
  MONITORING: 'monitoring',
  INDEXING: 'indexing',
  TESTING: 'testing',
  SANDBOX: 'sandbox',
  AI_DEVELOPER: 'aiDeveloper',
}

const log = { warn: (...a: unknown[]) => console.warn('[agents]', ...a), error: (...a: unknown[]) => console.error('[agents]', ...a) }