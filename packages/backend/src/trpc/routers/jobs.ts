import { z } from 'zod'
import { router, protectedProcedure, permissionProcedure } from '../trpc'
import { prisma } from '../../db'
import { TRPCError } from '@trpc/server'
import { JobStatus, JobType } from '@prisma/client'
import { jobService } from '../../lib/jobs'
import { writeAuditLog } from '../../lib/audit.js'
import { queues } from '../../queues/index.js'

const JobTypeSchema = z.enum([
  'RETRIEVAL', 'ANALYSIS', 'DRAFTING', 'VALIDATION', 'AUDIT',
  'ORCHESTRATOR', 'PRIVACY', 'DEBATE', 'MONITORING', 'INDEXING',
  'TESTING', 'SANDBOX', 'AI_DEVELOPER',
])

const JobStatusSchema = z.enum([
  'QUEUED', 'RUNNING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING',
])

export const jobsRouter = router({
  list: protectedProcedure
    .input(z.object({
      jobType: JobTypeSchema.optional(),
      status: JobStatusSchema.optional(),
      traceId: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const jobs = await jobService.list({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        jobType: input.jobType as JobType,
        status: input.status as JobStatus,
        traceId: input.traceId,
        limit: input.limit,
        cursor: input.cursor,
      })

      let nextCursor: string | undefined
      if (jobs.length > input.limit) nextCursor = jobs.pop()?.id
      return { jobs, nextCursor, hasMore: !!nextCursor }
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const job = await prisma.job.findUnique({ where: { id: input.id } })
      if (!job) throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' })
      if (ctx.orgId && job.orgId && job.orgId !== ctx.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cross-organisation access denied' })
      }
      if (ctx.userId && job.userId && job.userId !== ctx.userId && ctx.orgId !== job.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }
      return job
    }),

  create: protectedProcedure
    .input(z.object({
      jobType: JobTypeSchema,
      priority: z.number().int().min(1).max(100).default(10),
      input: z.record(z.string(), z.unknown()).optional(),
      maxAttempts: z.number().int().min(1).max(10).default(3),
      idempotencyKey: z.string().optional(),
      traceId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const job = await jobService.create({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId ?? undefined,
        traceId: input.traceId ?? ctx.traceId,
        jobType: input.jobType as JobType,
        priority: input.priority,
        input: input.input ? JSON.parse(JSON.stringify(input.input)) : undefined,
        maxAttempts: input.maxAttempts,
        idempotencyKey: input.idempotencyKey,
      })

      // Dispatch to the appropriate queue
      const queueName = JOB_TYPE_TO_QUEUE[input.jobType as JobType]
      if (!queueName) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `No queue configured for job type ${input.jobType}` })
      }

      const queueData = {
        ...input.input,
        traceId: job.traceId,
        userId: ctx.userId,
        orgId: ctx.orgId,
        jobId: job.id,
      }

      const queueMap: Record<string, { name: string; queue: any }> = {
        retrieval: { name: 'retrieve', queue: queues.retrieval },
        analysis: { name: 'analyse', queue: queues.analysis },
        drafting: { name: 'draft', queue: queues.drafting },
        validation: { name: 'validate', queue: queues.validation },
        audit: { name: 'audit', queue: queues.audit },
        orchestrator: { name: 'full', queue: queues.orchestrator },
        privacy: { name: 'privacy', queue: queues.privacy },
        debate: { name: 'debate', queue: queues.debate },
        monitoring: { name: 'monitor', queue: queues.monitoring },
        indexing: { name: 'index', queue: queues.indexing },
        testing: { name: 'test', queue: queues.testing },
        sandbox: { name: 'exec', queue: queues.sandbox },
        ai_developer: { name: 'develop', queue: queues.aiDeveloper },
      }

      const queueEntry = queueMap[input.jobType.toLowerCase().replace('_', '-')]
      if (!queueEntry) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `No queue entry for job type ${input.jobType}` })
      }

      await queueEntry.queue.add(queueEntry.name, queueData, {
        jobId: `${job.id}`,
        priority: input.priority,
        removeOnComplete: false,
        removeOnFail: false,
      })

      await writeAuditLog({
        traceId: job.traceId,
        agentName: 'jobs',
        userId: ctx.userId ?? undefined,
        action: 'job_created',
        input: { jobType: input.jobType, priority: input.priority },
        output: { jobId: job.id, queue: queueEntry.queue.name },
        durationMs: 0,
      })

      return { jobId: job.id, traceId: job.traceId, status: 'QUEUED' as const }
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const job = await prisma.job.findUnique({ where: { id: input.id } })
      if (!job) throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' })
      if (ctx.orgId && job.orgId && job.orgId !== ctx.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
        return job
      }

      const updated = await jobService.markCancelled(job.id)

      const queueName = JOB_TYPE_TO_QUEUE[job.jobType as JobType]
      if (queueName && queues[queueName as keyof typeof queues as keyof typeof queues]) {
        try {
          const bullJob = await queues[queueName as keyof typeof queues as keyof typeof queues].getJob(job.id)
          if (bullJob) await bullJob.remove()
        } catch (err) {
          console.warn({ err: (err as Error).message, jobId: job.id }, 'Failed to remove BullMQ job')
        }
      }

      await writeAuditLog({
        traceId: job.traceId,
        agentName: 'jobs',
        userId: ctx.userId ?? undefined,
        action: 'job_cancelled',
        input: { jobId: job.id },
        output: { status: 'CANCELLED' },
        durationMs: 0,
      })

      return updated
    }),

  retry: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const job = await prisma.job.findUnique({ where: { id: input.id } })
      if (!job) throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' })
      if (ctx.orgId && job.orgId && job.orgId !== ctx.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      if (job.attempts >= job.maxAttempts) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Max attempts reached' })
      }

      const updated = await jobService.retry(job.id)

      const queueName = JOB_TYPE_TO_QUEUE[job.jobType as JobType]
      if (queueName && queues[queueName as keyof typeof queues as keyof typeof queues]) {
        const queueEntry = Object.entries(JOB_TYPE_TO_QUEUE).find(([_, q]) => q === queueName)
        const jobTypeName = Object.keys(JOB_TYPE_TO_QUEUE).find(k => JOB_TYPE_TO_QUEUE[k as JobType] === queueName)
      }

      await writeAuditLog({
        traceId: job.traceId,
        agentName: 'jobs',
        userId: ctx.userId ?? undefined,
        action: 'job_retried',
        input: { jobId: job.id, attempts: job.attempts + 1 },
        output: { status: 'QUEUED' },
        durationMs: 0,
      })

      return updated
    }),

  stats: protectedProcedure
    .query(async ({ ctx }) => {
      return jobService.getStats(ctx.orgId ?? undefined)
    }),

  stale: permissionProcedure('manage_users')
    .input(z.object({
      thresholdMinutes: z.number().int().min(1).max(1440).default(10),
    }))
    .query(async ({ input }) => {
      const stale = await jobService.getStaleJobs(input.thresholdMinutes)
      return stale.map(j => ({
        id: j.id,
        jobType: j.jobType,
        status: j.status,
        traceId: j.traceId,
        updatedAt: j.updatedAt,
      }))
    }),
})

const JOB_TYPE_TO_QUEUE: Partial<Record<JobType, string>> = {
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

export type JobsRouter = typeof jobsRouter