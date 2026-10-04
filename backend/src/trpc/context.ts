import { prisma } from '../db'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { randomUUID } from 'crypto'
import { validateSession } from '../lib/auth'

/**
 * Resolves the caller's address for rate limiting and audit records.
 *
 * Deliberately uses only `req.ip`, never a raw X-Forwarded-For read. server.ts
 * sets `trust proxy` to loopback + private ranges, so Express walks the
 * forwarded chain from the closest hop and returns the first address that is
 * not a trusted proxy. That is correct on every path this app has:
 *
 *  - Caddy overwrites X-Forwarded-For and connects over the Docker bridge.
 *  - The Next.js relay (lib/backend-proxy.ts) passes the browser's header on,
 *    and is itself a trusted private-range hop.
 *  - Fly's edge appends to X-Forwarded-For, so the address nearest the server
 *    is always the real client even if the caller sent its own header.
 *  - A caller connecting straight to this process cannot spoof anything,
 *    because its own socket address is not a trusted range.
 */
function resolveClientIp(req: CreateExpressContextOptions['req']): string | undefined {
  return req.ip || req.socket?.remoteAddress || undefined
}

export const createContext = async (opts: CreateExpressContextOptions) => {
  const traceId = (opts.req.headers['x-trace-id'] as string) || randomUUID()
  const token = (opts.req.headers['authorization'] as string)?.replace('Bearer ', '')
  const user = token ? await validateSession(token) : null
  const ipAddress = resolveClientIp(opts.req)
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
