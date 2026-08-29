import { z } from 'zod'
import { router, protectedProcedure, permissionProcedure } from '../trpc'
import { prisma } from '../../db'
import { TRPCError } from '@trpc/server'
import { queues } from '../../queues/index'

const contractTypeSchema = z.enum(['NDA', 'SERVICE', 'EMPLOYMENT', 'LEASE', 'SALE', 'LOAN', 'PARTNERSHIP', 'OTHER'])
const contractStatusSchema = z.enum(['draft', 'review', 'negotiation', 'executed', 'expired', 'terminated'])

export const contractsRouter = router({

  list: protectedProcedure
    .input(z.object({
      clientId: z.string().optional(),
      matterId: z.string().optional(),
      status: contractStatusSchema.optional(),
      contractType: contractTypeSchema.optional(),
      expiringWithinDays: z.number().optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId ?? undefined }
      if (input.clientId) where.clientId = input.clientId
      if (input.matterId) where.matterId = input.matterId
      if (input.status) where.status = input.status
      if (input.contractType) where.contractType = input.contractType
      if (input.expiringWithinDays) {
        const cutoff = new Date(Date.now() + input.expiringWithinDays * 24 * 60 * 60 * 1000)
        where.expiryDate = { lte: cutoff, gte: new Date() }
      }
      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: 'insensitive' } },
          { counterparty: { contains: input.search, mode: 'insensitive' } },
        ]
      }
      const contracts = await prisma.contract.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { updatedAt: 'desc' },
        include: {
          client: { select: { id: true, name: true } },
          matter: { select: { id: true, title: true } },
        },
      })
      let nextCursor: string | undefined
      if (contracts.length > input.limit) nextCursor = contracts.pop()?.id
      return { contracts, nextCursor, hasMore: !!nextCursor }
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const contract = await prisma.contract.findFirst({
        where: { id: input, orgId: ctx.orgId ?? undefined },
        include: {
          client: true,
          matter: { select: { id: true, title: true, matterNumber: true } },
        },
      })
      if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' })
      return contract
    }),

  create: permissionProcedure('edit_document')
    .input(z.object({
      clientId: z.string().optional(),
      matterId: z.string().optional(),
      title: z.string().min(1).max(500),
      contractType: contractTypeSchema,
      counterparty: z.string().optional(),
      value: z.number().optional(),
      currency: z.string().default('MYR'),
      effectiveDate: z.string().datetime().optional(),
      expiryDate: z.string().datetime().optional(),
      autoRenew: z.boolean().default(false),
      renewalNoticeDays: z.number().default(30),
      content: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return prisma.contract.create({
        data: {
          ...input,
          orgId: ctx.orgId ?? undefined,
          createdBy: ctx.userId,
          effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : undefined,
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
        },
      })
    }),

  update: permissionProcedure('edit_document')
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      status: contractStatusSchema.optional(),
      counterparty: z.string().optional(),
      value: z.number().optional(),
      effectiveDate: z.string().datetime().optional(),
      expiryDate: z.string().datetime().optional(),
      autoRenew: z.boolean().optional(),
      content: z.string().optional(),
      riskScore: z.number().min(0).max(1).optional(),
      riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      obligations: z.record(z.string(), z.unknown()).optional(),
      keyTerms: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, effectiveDate, expiryDate, ...rest } = input
      const existing = await prisma.contract.findUnique({ where: { id }, select: { version: true } })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' })
      return prisma.contract.update({
        where: { id },
        data: {
          ...rest,
          obligations: (input.obligations ?? undefined) as any,
          keyTerms: (input.keyTerms ?? undefined) as any,
          effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          version: rest.content !== undefined ? existing.version + 1 : existing.version,
        },
      })
    }),

  analyzeWithAI: permissionProcedure('run_agents')
    .input(z.object({
      contractId: z.string(),
      analysisType: z.enum(['risk', 'obligations', 'playbook_compare', 'full']).default('full'),
    }))
    .mutation(async ({ input, ctx }) => {
      const contract = await prisma.contract.findFirst({
        where: { id: input.contractId, orgId: ctx.orgId ?? undefined },
      })
      if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' })
      const job = await queues.analysis.add('contract_analysis', {
        contractId: input.contractId,
        content: contract.content,
        contractType: contract.contractType,
        analysisType: input.analysisType,
        traceId: ctx.traceId,
        userId: ctx.userId,
      })
      return { jobId: job.id, traceId: ctx.traceId }
    }),

  getExpiringContracts: protectedProcedure
    .input(z.object({ withinDays: z.number().default(90) }))
    .query(async ({ input, ctx }) => {
      const cutoff = new Date(Date.now() + input.withinDays * 24 * 60 * 60 * 1000)
      return prisma.contract.findMany({
        where: {
          orgId: ctx.orgId ?? undefined,
          status: 'executed',
          expiryDate: { lte: cutoff, gte: new Date() },
        },
        include: { client: { select: { name: true } } },
        orderBy: { expiryDate: 'asc' },
        take: 50,
      })
    }),

  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.orgId ?? undefined
      const [total, byStatus, byType, expiringSoon] = await Promise.all([
        prisma.contract.count({ where: { orgId } }),
        prisma.contract.groupBy({ by: ['status'], where: { orgId }, _count: { id: true } }),
        prisma.contract.groupBy({ by: ['contractType'], where: { orgId }, _count: { id: true } }),
        prisma.contract.count({
          where: {
            orgId,
            status: 'executed',
            expiryDate: { lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), gte: new Date() },
          },
        }),
      ])
      return {
        total,
        expiringSoon,
        byStatus: Object.fromEntries(byStatus.map((s: any) => [s.status, s._count.id])),
        byType: Object.fromEntries(byType.map((t: any) => [t.contractType, t._count.id])),
      }
    }),
})
