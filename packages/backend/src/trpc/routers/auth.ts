import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc'
import { prisma } from '../../db'
import { hashPassword, verifyPassword, needsRehash, createSession, deleteSession, ROLES } from '../../lib/auth'
import {
  loginAccountKey,
  loginAddressKey,
  signupKey,
  registerKey,
  orgKey,
  throttleRetryAfterMs,
  recordThrottleFailure,
  clearThrottleFailures,
  LOGIN_POLICY,
  SIGNUP_POLICY,
  type ThrottlePolicy,
} from '../../lib/security/authThrottle'

/** Blocks the attempt and tells the caller how long the lockout lasts. */
function assertNotThrottled(keys: string[], policy: ThrottlePolicy): void {
  let retryAfterMs = 0
  for (const key of keys) retryAfterMs = Math.max(retryAfterMs, throttleRetryAfterMs(key, policy))
  if (retryAfterMs <= 0) return
  throw new TRPCError({
    code: 'TOO_MANY_REQUESTS',
    message: `Too many failed attempts. Try again in ${Math.ceil(retryAfterMs / 1000)}s.`,
  })
}

export const authRouter = router({
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().optional(),
      orgSlug: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const keys = [registerKey(ctx.ipAddress)]
      assertNotThrottled(keys, SIGNUP_POLICY)
      // Counted at entry so a caller cannot probe for free; forgiven on any
      // success. Per-IP and generous, because CONFLICT/NOT_FOUND below are
      // ordinary user mistakes rather than abuse.
      recordThrottleFailure(keys[0]!, SIGNUP_POLICY)

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
          passwordHash: await hashPassword(input.password),
          orgId,
          role: 'viewer',
        },
        select: { id: true, email: true, name: true, role: true, orgId: true },
      })

      clearThrottleFailures(keys)
      const token = await createSession(user.id, { userAgent: ctx.userAgent, ipAddress: ctx.ipAddress })
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
    .mutation(async ({ ctx, input }) => {
      // signup is public and provisions an org + admin user, so it is the real
      // abuse vector. Its bucket is separate from register and createOrg so one
      // endpoint's failures cannot lock out the others.
      const keys = [signupKey(ctx.ipAddress)]
      assertNotThrottled(keys, SIGNUP_POLICY)
      recordThrottleFailure(keys[0]!, SIGNUP_POLICY)

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
            passwordHash: await hashPassword(input.password),
            orgId: org.id,
            role: 'admin',
          },
          select: { id: true, email: true, name: true, role: true, orgId: true },
        })
      })

      clearThrottleFailures(keys)
      const token = await createSession(user.id, { userAgent: ctx.userAgent, ipAddress: ctx.ipAddress })
      return { user, token }
    }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Two buckets: the account bucket is address-independent, so spreading
      // guesses across source IPs (or forging a header) does not buy fresh
      // attempts. The address bucket blunts spraying one account from many IPs.
      const keys = [loginAccountKey(input.email), loginAddressKey(ctx.ipAddress, input.email)]
      assertNotThrottled(keys, LOGIN_POLICY)

      const user = await prisma.user.findUnique({ where: { email: input.email } })
      // verifyPassword also runs a dummy derivation when the account is
      // missing, so unknown-email and wrong-password cost the same.
      const passwordOk = await verifyPassword(input.password, user?.passwordHash)
      if (!user || !passwordOk) {
        for (const key of keys) recordThrottleFailure(key, LOGIN_POLICY)
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })
      }

      clearThrottleFailures(keys)

      // Transparent upgrade: legacy `salt:hmac` hashes and any weaker scrypt
      // parameters are replaced the first time the owner proves the password.
      if (needsRehash(user.passwordHash)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: await hashPassword(input.password) },
        }).catch(() => {})
      }

      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      const token = await createSession(user.id, { userAgent: ctx.userAgent, ipAddress: ctx.ipAddress })
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

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().trim().min(1).max(120),
      phone: z.string().trim().max(40).nullable(),
      jobTitle: z.string().trim().max(120).nullable(),
      bio: z.string().trim().max(1000).nullable(),
      timezone: z.string().trim().min(1).max(80),
      language: z.enum(['en', 'ms', 'zh', 'ta']),
      profilePhoto: z.string().max(512).nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.profilePhoto && (!input.profilePhoto.startsWith(`profiles/${ctx.user.id}/`) || !/^profiles\/[a-zA-Z0-9_-]{1,64}\/[a-f0-9-]{36}-[a-zA-Z0-9._-]+$/.test(input.profilePhoto)))
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid profile photo path' })
      return prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
        select: { id: true, name: true, email: true, phone: true, jobTitle: true, bio: true, timezone: true, language: true, profilePhoto: true },
      })
    }),

  changePassword: protectedProcedure
    .input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(12).max(256) }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({ where: { id: ctx.user.id } })
      if (!user?.passwordHash || !(await verifyPassword(input.currentPassword, user.passwordHash)))
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Current password is incorrect' })
      if (input.currentPassword === input.newPassword)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Choose a different password' })
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(input.newPassword) } })
      if (ctx.sessionToken) await prisma.session.deleteMany({ where: { userId: user.id, token: { not: ctx.sessionToken } } })
      return { ok: true, signedOutOtherSessions: true }
    }),

  sessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions: Array<{ id: string; userAgent: string | null; ipAddress: string | null; createdAt: Date; token: string }> = await prisma.session.findMany({
      where: { userId: ctx.user.id, expiresAt: { gt: new Date() } },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, token: true },
      orderBy: { createdAt: 'desc' },
    })
    return sessions.map(({ token, ...session }) => ({ ...session, current: token === ctx.sessionToken }))
  }),

  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const session = await prisma.session.findFirst({ where: { id: input.sessionId, userId: ctx.user.id } })
      if (!session) throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' })
      await prisma.session.delete({ where: { id: session.id } })
      return { ok: true, revokedCurrent: session.token === ctx.sessionToken }
    }),

  revokeOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await prisma.session.deleteMany({ where: { userId: ctx.user.id, token: { not: ctx.sessionToken ?? '' } } })
    return { ok: true, count: result.count }
  }),

  me: protectedProcedure
    .query(async ({ ctx }) => ({
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role,
      orgId: ctx.user.orgId,
      org: ctx.user.org,
      profile: await prisma.user.findUnique({ where: { id: ctx.user.id }, select: { phone: true, jobTitle: true, bio: true, timezone: true, language: true, profilePhoto: true } }),
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
    .mutation(async ({ ctx, input }) => {
      // Unauthenticated org creation is a spam vector. Keyed by address and
      // slug so probing for taken slugs cannot exhaust a shared counter, and
      // separate from signup so its success cannot reset signup's budget.
      const keys = [orgKey(ctx.ipAddress, input.slug)]
      assertNotThrottled(keys, SIGNUP_POLICY)
      recordThrottleFailure(keys[0]!, SIGNUP_POLICY)

      const existing = await prisma.organisation.findUnique({ where: { slug: input.slug } })
      if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Slug already taken' })
      const org = await prisma.organisation.create({ data: { name: input.name, slug: input.slug } })
      clearThrottleFailures(keys)
      return org
    }),
})
