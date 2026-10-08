import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure, permissionProcedure } from '../trpc'
import { prisma } from '../../db'
import { jobService } from '../../lib/jobs'
import { queues } from '../../queues/index'
import { writeAuditLog } from '../../lib/audit.js'
import type { AnyRouter } from '@trpc/server'

const AUTOMATION_STATUS = z.enum(['draft', 'active', 'paused', 'archived'])
const RUN_STATUS = z.enum(['queued', 'running', 'success', 'failed', 'cancelled'])
const RUN_TRIGGER = z.enum(['manual', 'scheduled', 'webhook', 'api'])

const definitionSchema = z.object({
  nodes: z.array(z.record(z.string(), z.unknown())).default([]),
  edges: z.array(z.record(z.string(), z.unknown())).default([]),
})

const JOB_STATUS_TO_RUN: Record<string, string> = {
  QUEUED: 'queued',
  RUNNING: 'running',
  PROCESSING: 'running',
  RETRYING: 'running',
  COMPLETED: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
}

function orgScope(ctx: { orgId: string | null }) {
  return ctx.orgId ? { orgId: ctx.orgId } : {}
}

async function syncRunStatus(runId: string): Promise<void> {
  const run = await prisma.automationRun.findUnique({ where: { id: runId } })
  if (!run || !run.jobId) return
  if (['success', 'failed', 'cancelled'].includes(run.status)) return
  const job = await prisma.job.findUnique({ where: { id: run.jobId } })
  if (!job) return
  const mapped = JOB_STATUS_TO_RUN[job.status]
  if (!mapped || mapped === run.status) return
  const finished = ['success', 'failed', 'cancelled'].includes(mapped) ? new Date() : null
  await prisma.automationRun.update({
    where: { id: runId },
    data: {
      status: mapped,
      finishedAt: finished,
      durationMs:
        job.startedAt && finished
          ? Math.max(0, finished.getTime() - new Date(job.startedAt).getTime())
          : undefined,
      errorMessage: job.errorMessage ?? undefined,
      output: job.result as never,
    },
  })
}

function toRunRow(row: {
  id: string
  automationId: string
  orgId: string | null
  userId: string | null
  jobId: string | null
  status: string
  trigger: string
  input: unknown
  output: unknown
  errorMessage: string | null
  startedAt: Date | null
  finishedAt: Date | null
  durationMs: number | null
  nodeResults: unknown
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: row.id,
    workflowId: row.automationId,
    status: row.status,
    trigger: row.trigger,
    jobId: row.jobId,
    input: row.input,
    output: row.output,
    errorMessage: row.errorMessage,
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    durationMs: row.durationMs,
    nodeResults: (row.nodeResults as Array<{ nodeId: string; status: string; message?: string }>) ?? [],
    createdAt: row.createdAt.toISOString(),
  }
}

export const automationsRouter: AnyRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        status: AUTOMATION_STATUS.optional(),
        category: z.string().optional(),
        sortBy: z.enum(['name', 'updatedAt', 'createdAt', 'lastRunAt']).default('updatedAt'),
        sortDir: z.enum(['asc', 'desc']).default('desc'),
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        ...orgScope(ctx),
        ...(input.query
          ? {
              OR: [
                { name: { contains: input.query, mode: 'insensitive' as const } },
                { description: { contains: input.query, mode: 'insensitive' as const } },
              ],
            }
          : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.category ? { category: input.category } : {}),
      }

      const rows = await prisma.automation.findMany({
        where,
        orderBy: { [input.sortBy]: input.sortDir },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      })

      let nextCursor: string | undefined
      if (rows.length > input.limit) nextCursor = rows.pop()?.id

      const runCounts = await prisma.automationRun.groupBy({
        by: ['automationId', 'status'],
        where: { automationId: { in: rows.map((r) => r.id) } },
        _count: { id: true },
      })
      const runsByAutomation = new Map<string, { total: number; success: number; active: number; lastRunAt: Date | null }>()
      for (const r of runCounts) {
        const cur = runsByAutomation.get(r.automationId) ?? { total: 0, success: 0, active: 0, lastRunAt: null }
        cur.total += r._count.id
        if (r.status === 'success') cur.success += r._count.id
        if (r.status === 'queued' || r.status === 'running') cur.active += r._count.id
        runsByAutomation.set(r.automationId, cur)
      }

      return {
        items: rows.map((a) => {
          const stats = runsByAutomation.get(a.id) ?? { total: 0, success: 0, active: 0, lastRunAt: null }
          return {
            id: a.id,
            name: a.name,
            description: a.description,
            category: a.category,
            status: a.status,
            templateId: a.templateId,
            tags: (a.tags as string[] | null) ?? [],
            lastRunAt: a.lastRunAt?.toISOString() ?? null,
            totalRuns: stats.total,
            successRate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : null,
            activeRuns: stats.active,
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
          }
        }),
        nextCursor,
        hasMore: !!nextCursor,
      }
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const automation = await prisma.automation.findFirst({
        where: { id: input.id, ...orgScope(ctx) },
      })
      if (!automation) throw new TRPCError({ code: 'NOT_FOUND', message: 'Automation not found' })

      const [runs, versions] = await Promise.all([
        prisma.automationRun.findMany({
          where: { automationId: automation.id },
          orderBy: { createdAt: 'desc' },
          take: 1,
        }),
        prisma.automationRun.groupBy({
          by: ['status'],
          where: { automationId: automation.id },
          _count: { id: true },
        }),
      ])

      const completed = versions.filter((v) => v.status === 'success').reduce((s, v) => s + v._count.id, 0)
      const total = versions.reduce((s, v) => s + v._count.id, 0)

      return {
        id: automation.id,
        name: automation.name,
        description: automation.description,
        category: automation.category,
        status: automation.status,
        templateId: automation.templateId,
        tags: (automation.tags as string[] | null) ?? [],
        definition: (automation.definition as { nodes: unknown[]; edges: unknown[] } | null) ?? { nodes: [], edges: [] },
        stats: {
          totalRuns: total,
          successRate: total > 0 ? Math.round((completed / total) * 100) : null,
          lastRunAt: runs[0]?.createdAt.toISOString() ?? null,
        },
        createdAt: automation.createdAt.toISOString(),
        updatedAt: automation.updatedAt.toISOString(),
      }
    }),

  create: permissionProcedure('edit_document')
    .input(
      z.object({
        name: z.string().trim().min(1).max(200),
        description: z.string().trim().max(2000).optional(),
        category: z.string().trim().max(100).optional(),
        templateId: z.string().optional(),
        definition: definitionSchema.optional(),
        tags: z.array(z.string().max(50)).max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const automation = await prisma.automation.create({
        data: {
          orgId: ctx.orgId ?? undefined,
          userId: ctx.userId ?? undefined,
          name: input.name,
          description: input.description,
          category: input.category,
          templateId: input.templateId,
          tags: input.tags,
          definition: (input.definition ?? { nodes: [], edges: [] }) as never,
        },
      })

      await prisma.automationVersion.create({
        data: {
          automationId: automation.id,
          versionNumber: 1,
          definition: (input.definition ?? { nodes: [], edges: [] }) as never,
          summary: 'Initial version',
          authorName: ctx.user?.name ?? undefined,
        },
      })

      await writeAuditLog({
        traceId: ctx.traceId,
        agentName: 'automations',
        userId: ctx.userId ?? undefined,
        action: 'automation_created',
        input: { name: input.name, templateId: input.templateId },
        output: { automationId: automation.id },
        durationMs: 0,
      })

      return { id: automation.id }
    }),

  update: permissionProcedure('edit_document')
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().trim().min(1).max(200).optional(),
        description: z.string().trim().max(2000).optional(),
        category: z.string().trim().max(100).optional(),
        tags: z.array(z.string().max(50)).max(20).optional(),
        definition: definitionSchema.optional(),
        versionSummary: z.string().trim().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.automation.findFirst({
        where: { id: input.id, ...orgScope(ctx) },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Automation not found' })

      const data: Record<string, unknown> = {}
      if (input.name !== undefined) data.name = input.name
      if (input.description !== undefined) data.description = input.description
      if (input.category !== undefined) data.category = input.category
      if (input.tags !== undefined) data.tags = input.tags
      if (input.definition !== undefined) data.definition = input.definition

      const updated = await prisma.automation.update({ where: { id: input.id }, data })

      if (input.definition !== undefined) {
        const latest = await prisma.automationVersion.findFirst({
          where: { automationId: input.id },
          orderBy: { versionNumber: 'desc' },
        })
        await prisma.automationVersion.create({
          data: {
            automationId: input.id,
            versionNumber: (latest?.versionNumber ?? 0) + 1,
            definition: input.definition as never,
            summary: input.versionSummary ?? 'Saved from builder',
            authorName: ctx.user?.name ?? undefined,
          },
        })
      }

      await writeAuditLog({
        traceId: ctx.traceId,
        agentName: 'automations',
        userId: ctx.userId ?? undefined,
        action: 'automation_updated',
        input: { automationId: input.id },
        output: { updatedAt: updated.updatedAt.toISOString() },
        durationMs: 0,
      })

      return { id: updated.id, updatedAt: updated.updatedAt.toISOString() }
    }),

  setStatus: permissionProcedure('edit_document')
    .input(z.object({ id: z.string().min(1), status: AUTOMATION_STATUS }))
    .mutation(async ({ ctx, input }) => {
      const automation = await prisma.automation.findFirst({
        where: { id: input.id, ...orgScope(ctx) },
      })
      if (!automation) throw new TRPCError({ code: 'NOT_FOUND', message: 'Automation not found' })

      const updated = await prisma.automation.update({
        where: { id: input.id },
        data: { status: input.status },
      })

      await writeAuditLog({
        traceId: ctx.traceId,
        agentName: 'automations',
        userId: ctx.userId ?? undefined,
        action: 'automation_status_changed',
        input: { automationId: input.id, status: input.status },
        output: null,
        durationMs: 0,
      })

      return { id: updated.id, status: updated.status }
    }),

  remove: permissionProcedure('manage_users')
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const automation = await prisma.automation.findFirst({
        where: { id: input.id, ...orgScope(ctx) },
      })
      if (!automation) throw new TRPCError({ code: 'NOT_FOUND', message: 'Automation not found' })

      await prisma.automationRun.deleteMany({ where: { automationId: input.id } })
      await prisma.automationVersion.deleteMany({ where: { automationId: input.id } })
      await prisma.automation.delete({ where: { id: input.id } })

      await writeAuditLog({
        traceId: ctx.traceId,
        agentName: 'automations',
        userId: ctx.userId ?? undefined,
        action: 'automation_deleted',
        input: { automationId: input.id, name: automation.name },
        output: null,
        durationMs: 0,
      })

      return { id: input.id }
    }),

  runs: router({
    list: protectedProcedure
      .input(
        z.object({
          automationId: z.string().min(1).optional(),
          status: RUN_STATUS.optional(),
          limit: z.number().int().min(1).max(100).default(20),
          cursor: z.string().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const where: Record<string, unknown> = {
          ...orgScope(ctx),
          ...(input.automationId ? { automationId: input.automationId } : {}),
          ...(input.status ? { status: input.status } : {}),
        }

        const rows = await prisma.automationRun.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: input.limit + 1,
          cursor: input.cursor ? { id: input.cursor } : undefined,
        })

        for (const row of rows) await syncRunStatus(row.id)

        const fresh = rows.length
          ? await prisma.automationRun.findMany({
              where: { id: { in: rows.map((r) => r.id) } },
              orderBy: { createdAt: 'desc' },
            })
          : []

        let nextCursor: string | undefined
        if (fresh.length > input.limit) nextCursor = fresh.pop()?.id

        return {
          items: fresh.map(toRunRow),
          nextCursor,
          hasMore: !!nextCursor,
        }
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        const run = await prisma.automationRun.findFirst({
          where: { id: input.id, ...orgScope(ctx) },
          include: { automation: { select: { name: true } } },
        })
        if (!run) throw new TRPCError({ code: 'NOT_FOUND', message: 'Run not found' })

        await syncRunStatus(run.id)
        const fresh = await prisma.automationRun.findUnique({
          where: { id: run.id },
          include: { automation: { select: { name: true } } },
        })
        if (!fresh) throw new TRPCError({ code: 'NOT_FOUND', message: 'Run not found' })

        return {
          ...toRunRow(fresh),
          workflowName: fresh.automation.name,
        }
      }),

    trigger: permissionProcedure('run_agents')
      .input(
        z.object({
          automationId: z.string().min(1),
          trigger: RUN_TRIGGER.default('manual'),
          input: z.record(z.string(), z.unknown()).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const automation = await prisma.automation.findFirst({
          where: { id: input.automationId, ...orgScope(ctx) },
        })
        if (!automation) throw new TRPCError({ code: 'NOT_FOUND', message: 'Automation not found' })
        if (automation.status === 'archived') {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Archived automations cannot run' })
        }

        const job = await jobService.create({
          orgId: ctx.orgId ?? undefined,
          userId: ctx.userId ?? undefined,
          traceId: ctx.traceId,
          jobType: 'ORCHESTRATOR' as never,
          input: {
            automationId: automation.id,
            automationName: automation.name,
            definition: automation.definition,
            ...(input.input ?? {}),
          } as never,
        })

        const run = await prisma.automationRun.create({
          data: {
            automationId: automation.id,
            orgId: ctx.orgId ?? undefined,
            userId: ctx.userId ?? undefined,
            jobId: job.id,
            status: 'queued',
            trigger: input.trigger,
            input: (input.input ?? {}) as never,
          },
        })

        try {
          await queues.orchestrator.add(
            'automation',
            {
              automationId: automation.id,
              automationName: automation.name,
              definition: automation.definition,
              runId: run.id,
              traceId: ctx.traceId,
              jobId: job.id,
            },
            { jobId: job.id },
          )
        } catch (err) {
          await prisma.automationRun.update({
            where: { id: run.id },
            data: { status: 'failed', errorMessage: `Queue dispatch failed: ${(err as Error).message}` },
          })
        }

        await prisma.automation.update({ where: { id: automation.id }, data: { lastRunAt: new Date() } })

        await writeAuditLog({
          traceId: ctx.traceId,
          agentName: 'automations',
          userId: ctx.userId ?? undefined,
          action: 'automation_run_triggered',
          input: { automationId: automation.id, trigger: input.trigger },
          output: { runId: run.id, jobId: job.id },
          durationMs: 0,
        })

        return { runId: run.id, jobId: job.id, status: 'queued' as const }
      }),

    cancel: permissionProcedure('run_agents')
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const run = await prisma.automationRun.findFirst({
          where: { id: input.id, ...orgScope(ctx) },
        })
        if (!run) throw new TRPCError({ code: 'NOT_FOUND', message: 'Run not found' })
        if (['success', 'failed', 'cancelled'].includes(run.status)) {
          return { id: run.id, status: run.status }
        }

        if (run.jobId) {
          try {
            await jobService.markCancelled(run.jobId)
          } catch {
            // Job may already be gone; the run row is the source of truth here.
          }
        }

        const updated = await prisma.automationRun.update({
          where: { id: run.id },
          data: { status: 'cancelled', finishedAt: new Date() },
        })

        await writeAuditLog({
          traceId: ctx.traceId,
          agentName: 'automations',
          userId: ctx.userId ?? undefined,
          action: 'automation_run_cancelled',
          input: { runId: run.id },
          output: { status: 'cancelled' },
          durationMs: 0,
        })

        return { id: updated.id, status: updated.status }
      }),

    retry: permissionProcedure('run_agents')
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const run = await prisma.automationRun.findFirst({
          where: { id: input.id, ...orgScope(ctx) },
        })
        if (!run) throw new TRPCError({ code: 'NOT_FOUND', message: 'Run not found' })
        if (!['failed', 'cancelled'].includes(run.status)) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Only failed or cancelled runs can be retried' })
        }

        const automation = await prisma.automation.findUnique({ where: { id: run.automationId } })
        if (!automation) throw new TRPCError({ code: 'NOT_FOUND', message: 'Automation not found' })

        const job = await jobService.create({
          orgId: ctx.orgId ?? undefined,
          userId: ctx.userId ?? undefined,
          traceId: ctx.traceId,
          jobType: 'ORCHESTRATOR' as never,
          input: {
            automationId: automation.id,
            automationName: automation.name,
            definition: automation.definition,
            retryOfRunId: run.id,
          } as never,
        })

        const newRun = await prisma.automationRun.create({
          data: {
            automationId: automation.id,
            orgId: ctx.orgId ?? undefined,
            userId: ctx.userId ?? undefined,
            jobId: job.id,
            status: 'queued',
            trigger: run.trigger,
            input: run.input ?? {},
          },
        })

        try {
          await queues.orchestrator.add(
            'automation',
            {
              automationId: automation.id,
              automationName: automation.name,
              definition: automation.definition,
              runId: newRun.id,
              retryOfRunId: run.id,
              traceId: ctx.traceId,
              jobId: job.id,
            },
            { jobId: job.id },
          )
        } catch (err) {
          await prisma.automationRun.update({
            where: { id: newRun.id },
            data: { status: 'failed', errorMessage: `Queue dispatch failed: ${(err as Error).message}` },
          })
        }

        await prisma.automation.update({ where: { id: automation.id }, data: { lastRunAt: new Date() } })

        return { runId: newRun.id, jobId: job.id, status: 'queued' as const }
      }),
  }),

  versions: router({
    list: protectedProcedure
      .input(z.object({ automationId: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        const automation = await prisma.automation.findFirst({
          where: { id: input.automationId, ...orgScope(ctx) },
        })
        if (!automation) throw new TRPCError({ code: 'NOT_FOUND', message: 'Automation not found' })

        const versions = await prisma.automationVersion.findMany({
          where: { automationId: input.automationId },
          orderBy: { versionNumber: 'desc' },
        })

        return {
          items: versions.map((v) => ({
            id: v.id,
            versionNumber: v.versionNumber,
            summary: v.summary,
            authorName: v.authorName,
            createdAt: v.createdAt.toISOString(),
            isCurrent: v.versionNumber === Math.max(...versions.map((x) => x.versionNumber)),
          })),
        }
      }),

    restore: permissionProcedure('edit_document')
      .input(z.object({ automationId: z.string().min(1), versionNumber: z.number().int().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const automation = await prisma.automation.findFirst({
          where: { id: input.automationId, ...orgScope(ctx) },
        })
        if (!automation) throw new TRPCError({ code: 'NOT_FOUND', message: 'Automation not found' })

        const version = await prisma.automationVersion.findFirst({
          where: { automationId: input.automationId, versionNumber: input.versionNumber },
        })
        if (!version) throw new TRPCError({ code: 'NOT_FOUND', message: 'Version not found' })

        const latest = await prisma.automationVersion.findFirst({
          where: { automationId: input.automationId },
          orderBy: { versionNumber: 'desc' },
        })
        const nextNumber = (latest?.versionNumber ?? 0) + 1

        await prisma.automation.update({
          where: { id: input.automationId },
          data: { definition: version.definition as never },
        })
        await prisma.automationVersion.create({
          data: {
            automationId: input.automationId,
            versionNumber: nextNumber,
            definition: version.definition as never,
            summary: `Restored from v${input.versionNumber}`,
            authorName: ctx.user?.name ?? undefined,
          },
        })

        await writeAuditLog({
          traceId: ctx.traceId,
          agentName: 'automations',
          userId: ctx.userId ?? undefined,
          action: 'automation_version_restored',
          input: { automationId: input.automationId, versionNumber: input.versionNumber },
          output: { newVersion: nextNumber },
          durationMs: 0,
        })

        return { automationId: input.automationId, versionNumber: nextNumber }
      }),
  }),

  analytics: protectedProcedure
    .input(z.object({ automationId: z.string().min(1).optional(), sinceDays: z.number().int().min(1).max(90).default(30) }))
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.sinceDays * 24 * 3600_000)
      const where: Record<string, unknown> = {
        ...orgScope(ctx),
        ...(input.automationId ? { automationId: input.automationId } : {}),
        createdAt: { gte: since },
      }

      const [total, byStatus, byDay] = await Promise.all([
        prisma.automationRun.count({ where }),
        prisma.automationRun.groupBy({ by: ['status'], where, _count: { id: true }, _avg: { durationMs: true } }),
        prisma.automationRun.groupBy({
          by: ['status'],
          where: { ...where, createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600_000) } },
          _count: { id: true },
        }),
      ])

      const completed = byStatus.find((s) => s.status === 'success')?._count.id ?? 0
      const avgDuration =
        byStatus.reduce((sum, s) => sum + (s._avg.durationMs ?? 0) * s._count.id, 0) / Math.max(1, total)

      const daily: Array<{ date: string; runs: number }> = []
      for (let i = input.sinceDays - 1; i >= 0; i--) {
        const day = new Date(Date.now() - i * 24 * 3600_000)
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
        const dayEnd = new Date(dayStart.getTime() + 24 * 3600_000)
        const count = await prisma.automationRun.count({
          where: { ...where, createdAt: { gte: dayStart, lt: dayEnd } },
        })
        daily.push({ date: dayStart.toISOString().slice(0, 10), runs: count })
      }

      return {
        since: since.toISOString(),
        totalRuns: total,
        successRate: total > 0 ? Math.round((completed / total) * 100) : null,
        avgDurationMs: Math.round(avgDuration),
        runs7d: byDay.reduce((s, r) => s + r._count.id, 0),
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.id])),
        daily,
      }
    }),

  integrations: protectedProcedure.query(async () => {
    // Typed integration registry. No third-party integration backend exists yet,
    // so every entry reports connected=false — the UI must not claim otherwise.
    return {
      items: [
        { id: 'lom', name: 'LOM Malaysia', description: 'Query Malaysian legislation.', category: 'legal', connected: false },
        { id: 'slack', name: 'Slack', description: 'Notify channels and request approvals.', category: 'communication', connected: false },
        { id: 'gmail', name: 'Gmail', description: 'Send and read email.', category: 'communication', connected: false },
        { id: 'gdrive', name: 'Google Drive', description: 'Store and read documents.', category: 'storage', connected: false },
        { id: 'dropbox', name: 'Dropbox', description: 'Sync documents.', category: 'storage', connected: false },
        { id: 'notion', name: 'Notion', description: 'Sync matter notes and docs.', category: 'productivity', connected: false },
        { id: 'webhook', name: 'Custom webhook', description: 'Connect any HTTP endpoint.', category: 'custom', connected: false },
      ],
    }
  }),
})
