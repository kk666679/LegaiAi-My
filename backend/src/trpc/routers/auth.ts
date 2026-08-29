import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc'
import { prisma } from '../../db'
import { hashPassword, verifyPassword, createSession, deleteSession, ROLES } from '../../lib/auth'

export const authRouter = router({
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().optional(),
      orgSlug: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = await prisma.user.findUnique({ where: { email: input.email } })
      if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Email already registered' })

      let orgId: string | undefined
      if (input.orgSlug) {
        const org = await prisma.organisation.findUnique({ where: { slug: input.orgSlug } })
        if (!org) throw new TRPCError({ code: 'NOT_FOUND', message: 'Organisation not found' })
        orgId = org.id
      }

      const user = await prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash: hashPassword(input.password),
          orgId,
          role: 'viewer',
        },
        select: { id: true, email: true, name: true, role: true, orgId: true },
      })

      const token = await createSession(user.id)
      return { user, token }
    }),

  signup: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().optional(),
      orgName: z.string().min(2),
      orgSlug: z.string().regex(/^[a-z0-9-]+$/),
    }))
    .mutation(async ({ input }) => {
      const existingUser = await prisma.user.findUnique({ where: { email: input.email } })
      if (existingUser) throw new TRPCError({ code: 'CONFLICT', message: 'Email already registered' })

      const existingOrg = await prisma.organisation.findUnique({ where: { slug: input.orgSlug } })
      if (existingOrg) throw new TRPCError({ code: 'CONFLICT', message: 'Organisation slug already taken' })

      const user = await prisma.$transaction(async (tx) => {
        const org = await tx.organisation.create({ data: { name: input.orgName, slug: input.orgSlug, plan: 'free' } })
        return tx.user.create({
          data: {
            email: input.email,
            name: input.name,
            passwordHash: hashPassword(input.password),
            orgId: org.id,
            role: 'admin',
          },
          select: { id: true, email: true, name: true, role: true, orgId: true },
        })
      })

      const token = await createSession(user.id)
      return { user, token }
    }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({ where: { email: input.email } })
      if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash))
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })

      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      const token = await createSession(user.id)
      return {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId },
      }
    }),

  logout: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      await deleteSession(input.token)
      return { ok: true }
    }),

  me: protectedProcedure
    .query(({ ctx }) => ({
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role,
      orgId: ctx.user.orgId,
      org: ctx.user.org,
    })),

  listUsers: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return prisma.user.findMany({
        where: { orgId: ctx.user.orgId ?? undefined },
        take: input.limit,
        select: { id: true, email: true, name: true, role: true, lastLoginAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })
    }),

  setRole: adminProcedure
    .input(z.object({ userId: z.string(), role: z.enum(ROLES) }))
    .mutation(async ({ ctx, input }) => {
      const target = await prisma.user.findUnique({ where: { id: input.userId } })
      if (!target || target.orgId !== ctx.user.orgId)
        throw new TRPCError({ code: 'NOT_FOUND' })
      return prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, email: true, role: true },
      })
    }),

  createOrg: publicProcedure
    .input(z.object({ name: z.string(), slug: z.string().regex(/^[a-z0-9-]+$/) }))
    .mutation(async ({ input }) => {
      const existing = await prisma.organisation.findUnique({ where: { slug: input.slug } })
      if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Slug already taken' })
      return prisma.organisation.create({ data: { name: input.name, slug: input.slug } })
    }),
})
