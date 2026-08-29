import type { Request, Response, NextFunction } from 'express'

interface Bucket {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()

export interface RateLimitOptions {
  windowMs?: number
  max?: number
  message?: string
  key?: (req: Request) => string
}

/**
 * Minimal in-memory fixed-window rate limiter.
 * Sufficient for a single-instance deployment; swap for Redis (BullMQ) backed
 * limiter when running multiple backend replicas.
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? 60_000
  const max = options.max ?? 120
  const message = options.message ?? 'Too many requests, please slow down.'
  const keyOf = options.key ?? ((req: Request) => req.ip ?? 'unknown')

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `rl:${keyOf(req)}`
    const now = Date.now()
    const bucket = store.get(key)

    if (!bucket || now >= bucket.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    bucket.count += 1
    if (bucket.count > max) {
      res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)))
      return res.status(429).json({ error: message })
    }
    next()
  }
}
