/**
 * HITL — Human-in-the-Loop Agent Control Router
 *
 * Authorization levels:
 *   0 = Read          — AI retrieves/analyses only
 *   1 = Recommend     — AI recommends, cannot execute
 *   2 = Draft         — AI drafts, human must approve
 *   3 = Execute+Approval — AI prepares, explicit human auth required
 *   4 = Controlled    — Pre-approved low-risk automation
 *   5 = Prohibited    — Never autonomous
 */
import { z } from 'zod'
import { router, protectedProcedure, permissionProcedure } from '../trpc'
import { prisma } from '../../db'
import { TRPCError } from '@trpc/server'

const authLevelSchema = z.number().int().min(0).max(5)
const actionStatusSchema = z.enum(['pending', 'approved', 'rejected', 'executed', 'cancelled'])

export const hitlRouter = router({

  // List pending agent actions requiring human review
  listPending: protectedProcedure
    .input(z.object({
      orgId: z.string().optional(),
      matterId: z.string().optional(),
      agentName: z.string().optional(),
      authLevel: authLevelSchema.optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      return prisma.agentAction.findMany({
        where: {
          orgId: ctx.orgId ?? input.orgId,
          status: 'pending',
          ...(input.matterId ? { matterId: input.matterId } : {}),
          ...(input.agentName ? { agentName: input.agentName } : {}),
          ...(input.authLevel !== undefined ? { authLevel: input.authLevel } : {}),
          // Only show actions that require human approval (level >= 2)
          authLevel: { gte: 2 },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        include: {
          matter: { select: { id: true, title: true, matterNumber: true, client: { select: { name: true } } } },
        },
      })
    }),

  listAll: protectedProcedure
    .input(z.object({
      orgId: z.string().optional(),
      matterId: z.string().optional(),
      status: actionStatusSchema.optional(),
      agentName: z.string().optional(),
      limit: z.number().default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const actions = await prisma.agentAction.findMany({
        where: {
          orgId: ctx.orgId ?? input.orgId,
          ...(input.matterId ? { matterId: input.matterId } : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(input.agentName ? { agentName: input.agentName } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          matter: { select: { id: true, title: true, matterNumber: true } },
        },
      })
      let nextCursor: string | undefined
      if (actions.length > input.limit) nextCursor = actions.pop()?.id
      return { actions, nextCursor, hasMore: !!nextCursor }
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const action = await prisma.agentAction.findUnique({ where: { id: input } })
      if (!action) throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent action not found' })
      return action
    }),

  // Human approves an agent action
  approve: permissionProcedure('approve_agent_action')
    .input(z.object({
      id: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const action = await prisma.agentAction.findUnique({ where: { id: input.id } })
      if (!action) throw new TRPCError({ code: 'NOT_FOUND', message: 'Action not found' })
      if (action.status !== 'pending') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Action is already ${action.status}` })
      }
      // Level 5 actions are prohibited — never approve
      if (action.authLevel === 5) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'This action class is prohibited from autonomous execution' })
      }
      return prisma.agentAction.update({
        where: { id: input.id },
        data: {
          status: 'approved',
          approvedBy: ctx.userId,
          approvedAt: new Date(),
          output: { ...(action.output as object ?? {}), approvalNotes: input.notes },
        },
      })
    }),

  // Human rejects an agent action
  reject: permissionProcedure('approve_agent_action')
    .input(z.object({
      id: z.string(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const action = await prisma.agentAction.findUnique({ where: { id: input.id } })
      if (!action) throw new TRPCError({ code: 'NOT_FOUND', message: 'Action not found' })
      if (action.status !== 'pending') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Action is already ${action.status}` })
      }
      return prisma.agentAction.update({
        where: { id: input.id },
        data: {
          status: 'rejected',
          rejectedBy: ctx.userId,
          rejectedAt: new Date(),
          output: { ...(action.output as object ?? {}), rejectionReason: input.reason },
        },
      })
    }),

  // Register a new agent action (called by agents, not users)
  register: protectedProcedure
    .input(z.object({
      orgId: z.string().optional(),
      matterId: z.string().optional(),
      agentName: z.string(),
      actionType: z.enum(['RETRIEVE', 'RECOMMEND', 'DRAFT', 'EXECUTE', 'AUTOMATE']),
      authLevel: authLevelSchema,
      title: z.string(),
      description: z.string().optional(),
      input: z.record(z.string(), z.unknown()).optional(),
      output: z.record(z.string(), z.unknown()).optional(),
      evidence: z.record(z.string(), z.unknown()).optional(),
      aiModel: z.string().optional(),
      toolsUsed: z.array(z.string()).default([]),
      traceId: z.string().optional(),
      expiresInMinutes: z.number().default(60),
    }))
    .mutation(async ({ input, ctx }) => {
      // Enforce: level 5 actions must never be registered as executable
      if (input.authLevel === 5) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Level 5 actions are prohibited' })
      }
      const expiresAt = new Date(Date.now() + input.expiresInMinutes * 60 * 1000)
      return prisma.agentAction.create({
        data: {
          orgId: input.orgId ?? ctx.orgId ?? undefined,
          matterId: input.matterId,
          agentName: input.agentName,
          actionType: input.actionType,
          authLevel: input.authLevel,
          title: input.title,
          description: input.description,
          input: (input.input ?? {}) as any,
          output: (input.output ?? {}) as any,
          evidence: (input.evidence ?? {}) as any,
          aiModel: input.aiModel,
          toolsUsed: input.toolsUsed,
          requestedBy: ctx.userId ?? 'agent',
          traceId: input.traceId,
          expiresAt,
          // Level 0-1 auto-approve (read/recommend only)
          status: input.authLevel <= 1 ? 'approved' : 'pending',
          approvedBy: input.authLevel <= 1 ? 'system:auto' : undefined,
          approvedAt: input.authLevel <= 1 ? new Date() : undefined,
        },
      })
    }),

  // Stats for governance dashboard
  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.orgId ?? undefined
      const [total, byStatus, byAgent, byAuthLevel, pendingCount] = await Promise.all([
        prisma.agentAction.count({ where: { orgId } }),
        prisma.agentAction.groupBy({ by: ['status'], where: { orgId }, _count: { id: true } }),
        prisma.agentAction.groupBy({ by: ['agentName'], where: { orgId }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
        prisma.agentAction.groupBy({ by: ['authLevel'], where: { orgId }, _count: { id: true } }),
        prisma.agentAction.count({ where: { orgId, status: 'pending', authLevel: { gte: 2 } } }),
      ])
      return {
        total,
        pendingApproval: pendingCount,
        byStatus: Object.fromEntries(byStatus.map((s: any) => [s.status, s._count.id])),
        byAgent: Object.fromEntries(byAgent.map((a: any) => [a.agentName, a._count.id])),
        byAuthLevel: Object.fromEntries(byAuthLevel.map((l: any) => [l.authLevel, l._count.id])),
      }
    }),
})
