import { z } from 'zod'
import { router, protectedProcedure, permissionProcedure } from '../trpc'
import { prisma } from '../../db'
import { TRPCError } from '@trpc/server'

export const clientsRouter = router({

  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(['active', 'inactive', 'conflict']).optional(),
      clientType: z.enum(['individual', 'corporate', 'government']).optional(),
      limit: z.number().default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId ?? undefined }
      if (input.status) where.status = input.status
      if (input.clientType) where.clientType = input.clientType
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' as const } },
          { email: { contains: input.search, mode: 'insensitive' as const } },
          { company: { contains: input.search, mode: 'insensitive' as const } },
        ]
      }
      const clients = await prisma.client.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { matters: true, contracts: true } } },
      })
      let nextCursor: string | undefined
      if (clients.length > input.limit) nextCursor = clients.pop()?.id
      return { clients, nextCursor, hasMore: !!nextCursor }
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const client = await prisma.client.findFirst({
        where: { id: input, orgId: ctx.orgId ?? undefined },
        include: {
          matters: {
            orderBy: { updatedAt: 'desc' },
            take: 10,
            select: { id: true, title: true, matterType: true, status: true, priority: true, deadlineAt: true },
          },
          contracts: {
            orderBy: { updatedAt: 'desc' },
            take: 10,
            select: { id: true, title: true, contractType: true, status: true, expiryDate: true },
          },
        },
      })
      if (!client) throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' })
      return client
    }),

  create: permissionProcedure('create_case')
    .input(z.object({
      name: z.string().min(1).max(300),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      clientType: z.enum(['individual', 'corporate', 'government']).default('individual'),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Basic conflict check: same name or email in org
      const existing = await prisma.client.findFirst({
        where: {
          orgId: ctx.orgId ?? undefined,
          OR: [
            { name: { equals: input.name, mode: 'insensitive' as const } },
            ...(input.email ? [{ email: input.email }] : []),
          ],
        },
      })
      return prisma.client.create({
        data: {
          ...input,
          orgId: ctx.orgId ?? undefined,
          createdBy: ctx.userId,
          conflictCheck: !!existing,
          status: existing ? 'conflict' : 'active',
        },
      })
    }),

  update: permissionProcedure('edit_document')
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      status: z.enum(['active', 'inactive', 'conflict']).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return prisma.client.update({ where: { id }, data })
    }),

  conflictCheck: protectedProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().optional(),
      company: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const conflicts = await prisma.client.findMany({
        where: {
          orgId: ctx.orgId ?? undefined,
          OR: [
            { name: { contains: input.name, mode: 'insensitive' as const } },
            ...(input.email ? [{ email: input.email }] : []),
            ...(input.company ? [{ company: { contains: input.company, mode: 'insensitive' as const } }] : []),
          ],
        },
        include: { _count: { select: { matters: true } } },
      })
      return {
        hasConflict: conflicts.length > 0,
        conflicts,
        checkedAt: new Date().toISOString(),
      }
    }),

  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.orgId ?? undefined
      const [total, byType, byStatus] = await Promise.all([
        prisma.client.count({ where: { orgId } }),
        prisma.client.groupBy({ by: ['clientType'], where: { orgId }, _count: { id: true } }),
        prisma.client.groupBy({ by: ['status'], where: { orgId }, _count: { id: true } }),
      ])
      return {
        total,
        byType: Object.fromEntries(byType.map((t: any) => [t.clientType, t._count.id])),
        byStatus: Object.fromEntries(byStatus.map((s: any) => [s.status, s._count.id])),
      }
    }),
})
