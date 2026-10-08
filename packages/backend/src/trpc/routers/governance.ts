/**
 * AI Governance Router
 * - Kill switch (emergency disable of all autonomous operations)
 * - Model usage tracking
 * - Cost analytics
 * - Hallucination / security incident logging
 * - Governance dashboard data
 */
import { z } from 'zod'
import { router, protectedProcedure, permissionProcedure } from '../trpc'
import { prisma } from '../../db'
import { publishEvent } from '../../lib/events/bus'

// In-memory kill switch state (in production: use Redis or DB flag)
let killSwitchActive = false
let killSwitchActivatedBy: string | null = null
let killSwitchActivatedAt: Date | null = null

export function isKillSwitchActive() { return killSwitchActive }

export const governanceRouter = router({

  // ── Kill Switch ──────────────────────────────────────────────────────────
  getKillSwitchStatus: protectedProcedure
    .query(() => ({
      active: killSwitchActive,
      activatedBy: killSwitchActivatedBy,
      activatedAt: killSwitchActivatedAt?.toISOString() ?? null,
    })),

  activateKillSwitch: permissionProcedure('manage_users')
    .input(z.object({ reason: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      killSwitchActive = true
      killSwitchActivatedBy = ctx.userId ?? 'unknown'
      killSwitchActivatedAt = new Date()

      await Promise.all([
        prisma.aIGovernanceLog.create({
          data: {
            orgId: ctx.orgId ?? undefined,
            eventType: 'KILL_SWITCH',
            userId: ctx.userId,
            details: { reason: input.reason, action: 'activated' },
          },
        }),
        publishEvent({ type: 'kill_switch.activated', reason: input.reason, userId: ctx.userId } as any),
      ])

      return { activated: true, at: killSwitchActivatedAt.toISOString() }
    }),

  deactivateKillSwitch: permissionProcedure('manage_users')
    .input(z.object({ reason: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      killSwitchActive = false
      killSwitchActivatedBy = null
      killSwitchActivatedAt = null

      await Promise.all([
        prisma.aIGovernanceLog.create({
          data: {
            orgId: ctx.orgId ?? undefined,
            eventType: 'KILL_SWITCH',
            userId: ctx.userId,
            details: { reason: input.reason, action: 'deactivated' },
          },
        }),
        publishEvent({ type: 'kill_switch.deactivated', reason: input.reason, userId: ctx.userId } as any),
      ])

      return { deactivated: true }
    }),

  // ── Governance Logs ──────────────────────────────────────────────────────
  getLogs: permissionProcedure('view_audit_log')
    .input(z.object({
      eventType: z.string().optional(),
      aiModel: z.string().optional(),
      userId: z.string().optional(),
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
      limit: z.number().default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const logs = await prisma.aIGovernanceLog.findMany({
        where: {
          orgId: ctx.orgId ?? undefined,
          ...(input.eventType ? { eventType: input.eventType } : {}),
          ...(input.aiModel ? { aiModel: input.aiModel } : {}),
          ...(input.userId ? { userId: input.userId } : {}),
          ...(input.from || input.to ? {
            createdAt: {
              ...(input.from ? { gte: new Date(input.from) } : {}),
              ...(input.to ? { lte: new Date(input.to) } : {}),
            },
          } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      })
      let nextCursor: string | undefined
      if (logs.length > input.limit) nextCursor = logs.pop()?.id
      return { logs, nextCursor, hasMore: !!nextCursor }
    }),

  logEvent: protectedProcedure
    .input(z.object({
      eventType: z.enum(['MODEL_USED', 'HALLUCINATION', 'SECURITY', 'COST', 'APPROVAL', 'REJECTION', 'KILL_SWITCH']),
      aiModel: z.string().optional(),
      provider: z.string().optional(),
      dataClass: z.enum(['public', 'internal', 'confidential', 'privileged']).optional(),
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
      costUsd: z.number().optional(),
      latencyMs: z.number().optional(),
      matterId: z.string().optional(),
      traceId: z.string().optional(),
      details: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return prisma.aIGovernanceLog.create({
        data: {
          ...input,
          details: input.details as any,
          orgId: ctx.orgId ?? undefined,
          userId: ctx.userId,
        },
      })
    }),

  // ── Cost & Usage Analytics ───────────────────────────────────────────────
  getCostAnalytics: permissionProcedure('view_audit_log')
    .input(z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
      groupBy: z.enum(['model', 'user', 'matter', 'day']).default('model'),
    }))
    .query(async ({ ctx, input }) => {
      const where = {
        orgId: ctx.orgId ?? undefined,
        eventType: 'MODEL_USED' as const,
        ...(input.from || input.to ? {
          createdAt: {
            ...(input.from ? { gte: new Date(input.from) } : {}),
            ...(input.to ? { lte: new Date(input.to) } : {}),
          },
        } : {}),
      }

      const [totalCost, byModel, totalTokens] = await Promise.all([
        prisma.aIGovernanceLog.aggregate({ where, _sum: { costUsd: true, promptTokens: true, completionTokens: true } }),
        prisma.aIGovernanceLog.groupBy({
          by: ['aiModel'],
          where,
          _sum: { costUsd: true, promptTokens: true, completionTokens: true },
          _count: { id: true },
          orderBy: { _sum: { costUsd: 'desc' } },
        }),
        prisma.aIGovernanceLog.aggregate({ where, _sum: { promptTokens: true, completionTokens: true } }),
      ])

      return {
        totalCostUsd: totalCost._sum.costUsd ?? 0,
        totalPromptTokens: totalTokens._sum.promptTokens ?? 0,
        totalCompletionTokens: totalTokens._sum.completionTokens ?? 0,
        byModel: byModel.map((m: any) => ({
          model: m.aiModel ?? 'unknown',
          costUsd: m._sum.costUsd ?? 0,
          calls: m._count.id,
          promptTokens: m._sum.promptTokens ?? 0,
          completionTokens: m._sum.completionTokens ?? 0,
        })),
      }
    }),

  // ── Dashboard Summary ────────────────────────────────────────────────────
  getDashboard: permissionProcedure('view_audit_log')
    .query(async ({ ctx }) => {
      const orgId = ctx.orgId ?? undefined
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const [
        totalActions, pendingApprovals, hallucinationCount,
        securityEvents, costLast7d, modelUsage,
      ] = await Promise.all([
        prisma.agentAction.count({ where: { orgId } }),
        prisma.agentAction.count({ where: { orgId, status: 'pending', authLevel: { gte: 2 } } }),
        prisma.aIGovernanceLog.count({ where: { orgId, eventType: 'HALLUCINATION', createdAt: { gte: since7d } } }),
        prisma.aIGovernanceLog.count({ where: { orgId, eventType: 'SECURITY', createdAt: { gte: since24h } } }),
        prisma.aIGovernanceLog.aggregate({
          where: { orgId, eventType: 'MODEL_USED', createdAt: { gte: since7d } },
          _sum: { costUsd: true },
        }),
        prisma.aIGovernanceLog.groupBy({
          by: ['aiModel'],
          where: { orgId, eventType: 'MODEL_USED', createdAt: { gte: since7d } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5,
        }),
      ])

      return {
        killSwitch: { active: killSwitchActive, activatedBy: killSwitchActivatedBy },
        totalAgentActions: totalActions,
        pendingApprovals,
        hallucinationCount7d: hallucinationCount,
        securityEvents24h: securityEvents,
        costLast7dUsd: costLast7d._sum.costUsd ?? 0,
        topModels: modelUsage.map((m: any) => ({ model: m.aiModel ?? 'unknown', calls: m._count.id })),
      }
    }),
})
