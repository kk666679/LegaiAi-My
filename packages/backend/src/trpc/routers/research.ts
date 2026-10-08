import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { router, protectedProcedure } from '../trpc'
import { prisma } from '../../db'

const authoritySchema = z.record(z.string(), z.unknown())

export const researchRouter = router({
  savedAuthorities: protectedProcedure.query(async ({ ctx }) =>
    prisma.savedAuthority.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
      select: { sourceId: true, authority: true, createdAt: true },
    }),
  ),

  saveAuthority: protectedProcedure.input(z.object({ sourceId: z.string().min(1).max(256), authority: authoritySchema }))
    .mutation(async ({ ctx, input }) => prisma.savedAuthority.upsert({
      where: { userId_sourceId: { userId: ctx.user.id, sourceId: input.sourceId } },
      create: { userId: ctx.user.id, sourceId: input.sourceId, authority: input.authority as Prisma.InputJsonValue },
      update: { authority: input.authority as Prisma.InputJsonValue },
      select: { sourceId: true, createdAt: true },
    })),

  removeSavedAuthority: protectedProcedure.input(z.object({ sourceId: z.string().min(1).max(256) }))
    .mutation(async ({ ctx, input }) => {
      await prisma.savedAuthority.deleteMany({ where: { userId: ctx.user.id, sourceId: input.sourceId } })
      return { ok: true }
    }),
})
