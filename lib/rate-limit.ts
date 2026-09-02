// Shared fixed-window rate limiter used by both the Next.js route handlers
// (app/api/**) and the Express backend (backend/src/middleware/rateLimit).
//
// Storage:
//   - If REDIS_URL is set, counters are kept in Redis via INCR + EXPIRE so
//     limits are consistent across replicas.
//   - Otherwise we fall back to a per-process Map (fine for dev / single
//     instance) with the same interface.
//
// Return shape is the "decision" only; the caller formats the HTTP response
// so this module does not depend on Next.js or Express types.

export interface RateLimitDecision {
  limited: boolean
  remaining: number
  retryAfterSeconds: number
}

export interface RateLimitOptions {
  key: string
  limit: number
  windowMs: number
}

let redis: import('ioredis').Redis | null = null
let redisAttempted = false

async function getRedis(): Promise<import('ioredis').Redis | null> {
  if (redisAttempted) return redis
  redisAttempted = true
  const url = process.env.REDIS_URL
  if (!url) return null
  try {
    const { default: IORedis } = await import('ioredis')
    redis = new IORedis(url, { lazyConnect: true, maxRetriesPerRequest: 1 })
    await redis.connect()
  } catch {
    redis = null
  }
  return redis
}

interface Bucket { count: number; resetAt: number }
const localStore = new Map<string, Bucket>()

export async function checkRateLimit(opts: RateLimitOptions): Promise<RateLimitDecision> {
  const { key, limit, windowMs } = opts
  const bucketKey = `rl:${key}`

  const r = await getRedis()
  if (r) {
    const count = await r.incr(bucketKey)
    if (count === 1) await r.pexpire(bucketKey, windowMs)
    const ttl = await r.pttl(bucketKey)
    if (count > limit) {
      return { limited: true, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(ttl / 1000)) }
    }
    return { limited: false, remaining: Math.max(0, limit - count), retryAfterSeconds: 0 }
  }

  const now = Date.now()
  const current = localStore.get(bucketKey)
  if (!current || current.resetAt <= now) {
    localStore.set(bucketKey, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: limit - 1, retryAfterSeconds: 0 }
  }
  current.count += 1
  if (current.count > limit) {
    return {
      limited: true,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }
  return { limited: false, remaining: Math.max(0, limit - current.count), retryAfterSeconds: 0 }
}

export function clientKeyFromHeaders(headers: Headers | Record<string, string | string[] | undefined>): string {
  const get = (name: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(name) ?? undefined
    const v = headers[name.toLowerCase()]
    return Array.isArray(v) ? v[0] : v
  }
  const xff = get('x-forwarded-for')?.split(',')[0]?.trim()
  return xff || get('x-real-ip') || 'unknown'
}
