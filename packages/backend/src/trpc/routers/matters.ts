import { z } from 'zod'
import { router, protectedProcedure, permissionProcedure } from '../trpc'
import { prisma } from '../../db'
import { TRPCError } from '@trpc/server'

const matterTypeSchema = z.enum([
  'LITIGATION', 'CONTRACT', 'ADVISORY', 'COMPLIANCE',
  'CONVEYANCING', 'CORPORATE', 'CRIMINAL', 'FAMILY', 'EMPLOYMENT', 'IP',
])
const matterStatusSchema = z.enum(['open', 'active', 'on_hold', 'closed', 'archived'])
const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

export const mattersRouter = router({

  list: protectedProcedure
    .input(z.object({
      orgId: z.string().optional(),
      clientId: z.string().optional(),
      status: matterStatusSchema.optional(),
      matterType: matterTypeSchema.optional(),
      assignedTo: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = {
        orgId: ctx.orgId ?? input.orgId,
      }
      if (input.clientId) where.clientId = input.clientId
      if (input.status) where.status = input.status
      if (input.matterType) where.matterType = input.matterType
      if (input.assignedTo) where.assignedTo = input.assignedTo
      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: 'insensitive' } },
          { caseNumber: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
        ]
      }
      const matters = await prisma.matter.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { updatedAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, email: true } },
          _count: { select: { agentActions: true, alerts: true } },
        },
      })
      let nextCursor: string | undefined
      if (matters.length > input.limit) {
        nextCursor = matters.pop()?.id
      }
      return { matters, nextCursor, hasMore: !!nextCursor }
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const matter = await prisma.matter.findFirst({
        where: { id: input, orgId: ctx.orgId ?? undefined },
        include: {
          client: true,
          contracts: { orderBy: { createdAt: 'desc' }, take: 10 },
          agentActions: { orderBy: { createdAt: 'desc' }, take: 20 },
          alerts: { where: { acknowledged: false }, orderBy: { createdAt: 'desc' } },
          riskScores: { orderBy: { createdAt: 'desc' }, take: 10 },
          timeline: { orderBy: { eventDate: 'desc' }, take: 50 },
        },
      })
      if (!matter) throw new TRPCError({ code: 'NOT_FOUND', message: 'Matter not found' })
      return matter
    }),

  create: permissionProcedure('create_case')
    .input(z.object({
      clientId: z.string(),
      title: z.string().min(1).max(500),
      matterType: matterTypeSchema,
      priority: prioritySchema.default('medium'),
      jurisdiction: z.string().default('MY'),
      court: z.string().optional(),
      caseNumber: z.string().optional(),
      description: z.string().optional(),
      assignedTo: z.string().optional(),
      deadlineAt: z.string().datetime().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const matterNumber = `M-${Date.now().toString(36).toUpperCase()}`
      return prisma.matter.create({
        data: {
          ...input,
          orgId: ctx.orgId ?? undefined,
          matterNumber,
          deadlineAt: input.deadlineAt ? new Date(input.deadlineAt) : undefined,
        },
      })
    }),

  update: permissionProcedure('edit_document')
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      status: matterStatusSchema.optional(),
      priority: prioritySchema.optional(),
      assignedTo: z.string().optional(),
      description: z.string().optional(),
      deadlineAt: z.string().datetime().optional(),
      riskScore: z.number().min(0).max(1).optional(),
      riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, deadlineAt, ...rest } = input
      return prisma.matter.update({
        where: { id },
        data: {
          ...rest,
          deadlineAt: deadlineAt ? new Date(deadlineAt) : undefined,
          lastActivityAt: new Date(),
        },
      })
    }),

  addEvent: protectedProcedure
    .input(z.object({
      matterId: z.string(),
      eventType: z.enum(['FILING', 'HEARING', 'DEADLINE', 'COMMUNICATION', 'DOCUMENT', 'PAYMENT', 'NOTE', 'MILESTONE']),
      title: z.string(),
      description: z.string().optional(),
      eventDate: z.string().datetime(),
      parties: z.array(z.string()).default([]),
      documents: z.array(z.string()).default([]),
    }))
    .mutation(async ({ input, ctx }) => {
      const [event] = await Promise.all([
        prisma.matterEvent.create({
          data: {
            ...input,
            eventDate: new Date(input.eventDate),
            createdBy: ctx.userId,
          },
        }),
        prisma.matter.update({
          where: { id: input.matterId },
          data: { lastActivityAt: new Date() },
        }),
      ])
      return event
    }),

  getTimeline: protectedProcedure
    .input(z.object({
      matterId: z.string(),
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
      eventTypes: z.array(z.string()).optional(),
    }))
    .query(async ({ input }) => {
      return prisma.matterEvent.findMany({
        where: {
          matterId: input.matterId,
          ...(input.from || input.to ? {
            eventDate: {
              ...(input.from ? { gte: new Date(input.from) } : {}),
              ...(input.to ? { lte: new Date(input.to) } : {}),
            },
          } : {}),
          ...(input.eventTypes?.length ? { eventType: { in: input.eventTypes } } : {}),
        },
        orderBy: { eventDate: 'asc' },
      })
    }),

  getAlerts: protectedProcedure
    .input(z.object({
      orgId: z.string().optional(),
      matterId: z.string().optional(),
      unacknowledgedOnly: z.boolean().default(true),
      severity: z.enum(['info', 'warning', 'high', 'critical']).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input, ctx }) => {
      return prisma.alert.findMany({
        where: {
          orgId: ctx.orgId ?? input.orgId,
          ...(input.matterId ? { matterId: input.matterId } : {}),
          ...(input.unacknowledgedOnly ? { acknowledged: false } : {}),
          ...(input.severity ? { severity: input.severity } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        include: { matter: { select: { id: true, title: true, matterNumber: true } } },
      })
    }),

  acknowledgeAlert: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      return prisma.alert.update({
        where: { id: input },
        data: { acknowledged: true, acknowledgedBy: ctx.userId, acknowledgedAt: new Date() },
      })
    }),

  getRiskScores: protectedProcedure
    .input(z.object({ matterId: z.string() }))
    .query(async ({ input }) => {
      return prisma.riskScore.findMany({
        where: { matterId: input.matterId },
        orderBy: { createdAt: 'desc' },
      })
    }),

  // Proactive intelligence: matters needing attention
  getAttentionRequired: protectedProcedure
    .input(z.object({ orgId: z.string().optional() }))
    .query(async ({ ctx }) => {
      const now = new Date()
      const in8Days = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000)
      const staleThreshold = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)

      const [deadlineSoon, staleMatters, criticalAlerts] = await Promise.all([
        prisma.matter.findMany({
          where: {
            orgId: ctx.orgId ?? undefined,
            status: { in: ['open', 'active'] },
            deadlineAt: { lte: in8Days, gte: now },
          },
          include: { client: { select: { name: true } } },
          orderBy: { deadlineAt: 'asc' },
          take: 20,
        }),
        prisma.matter.findMany({
          where: {
            orgId: ctx.orgId ?? undefined,
            status: { in: ['open', 'active'] },
            OR: [
              { lastActivityAt: { lte: staleThreshold } },
              { lastActivityAt: null },
            ],
          },
          include: { client: { select: { name: true } } },
          orderBy: { openedAt: 'asc' },
          take: 20,
        }),
        prisma.alert.findMany({
          where: {
            orgId: ctx.orgId ?? undefined,
            acknowledged: false,
            severity: { in: ['high', 'critical'] },
          },
          include: { matter: { select: { id: true, title: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ])

      return { deadlineSoon, staleMatters, criticalAlerts }
    }),

  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.orgId ?? undefined
      const [total, byStatus, byType, byPriority] = await Promise.all([
        prisma.matter.count({ where: { orgId } }),
        prisma.matter.groupBy({ by: ['status'], where: { orgId }, _count: { id: true } }),
        prisma.matter.groupBy({ by: ['matterType'], where: { orgId }, _count: { id: true } }),
        prisma.matter.groupBy({ by: ['priority'], where: { orgId }, _count: { id: true } }),
      ])
      return {
        total,
        byStatus: Object.fromEntries(byStatus.map((s: any) => [s.status, s._count.id])),
        byType: Object.fromEntries(byType.map((t: any) => [t.matterType, t._count.id])),
        byPriority: Object.fromEntries(byPriority.map((p: any) => [p.priority, p._count.id])),
      }
    }),
})
