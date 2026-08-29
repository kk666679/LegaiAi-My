import { prisma } from '../db'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { randomUUID } from 'crypto'
import { validateSession } from '../lib/auth'

export const createContext = async (opts: CreateExpressContextOptions) => {
  const traceId = (opts.req.headers['x-trace-id'] as string) || randomUUID()
  const token = (opts.req.headers['authorization'] as string)?.replace('Bearer ', '')
  const user = token ? await validateSession(token) : null
  const ipAddress = (opts.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || opts.req.headers['x-real-ip'] as string
    || opts.req.socket?.remoteAddress
    || undefined
  const userAgent = opts.req.headers['user-agent'] || undefined

  return {
    prisma,
    traceId,
    user,
    userId: user?.id ?? null,
    orgId: user?.orgId ?? null,
    ipAddress,
    userAgent,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
