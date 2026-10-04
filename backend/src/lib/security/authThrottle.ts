/**
 * In-process credential-stuffing throttle for the public auth procedures.
 *
 * The global HTTP limiter in server.ts only bounds a single IP at 120 req/min;
 * it does nothing against a botnet, and it is per-process, so it neither
 * survives a restart nor spans instances. This module adds an account-aware
 * failure counter keyed on IP + email so repeated password guesses against one
 * account lock out regardless of how the requests are distributed.
 *
 * State is deliberately in-process: it is a defence-in-depth control, not an
 * audit record. Swap for Redis if the backend is ever run multi-instance.
 */

const MAX_FAILURES = 5
const WINDOW_MS = 15 * 60_000
const LOCK_MS = 15 * 60_000
const MAX_BUCKETS = 10_000

interface Bucket {
  failures: number
  firstFailureAt: number
  lockedUntil: number
}

const buckets = new Map<string, Bucket>()

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.lockedUntil <= now && bucket.firstFailureAt + WINDOW_MS <= now) buckets.delete(key)
  }
  // Bound memory against unbounded key growth from rotating source IPs.
  if (buckets.size > MAX_BUCKETS) {
    const excess = buckets.size - MAX_BUCKETS
    let removed = 0
    for (const key of buckets.keys()) {
      buckets.delete(key)
      if (++removed >= excess) break
    }
  }
}

export function loginThrottleKey(ip: string | undefined, email: string): string {
  return `${ip ?? 'unknown'}|${email.trim().toLowerCase()}`
}

export function signupThrottleKey(ip: string | undefined): string {
  return `signup|${ip ?? 'unknown'}`
}

/** Remaining lockout in ms, or 0 when the key may attempt authentication. */
export function throttleRetryAfterMs(key: string): number {
  const bucket = buckets.get(key)
  if (!bucket) return 0
  return Math.max(0, bucket.lockedUntil - Date.now())
}

export function isThrottled(key: string): boolean {
  return throttleRetryAfterMs(key) > 0
}

export function recordThrottleFailure(key: string): void {
  const now = Date.now()
  prune(now)
  const bucket = buckets.get(key)
  if (!bucket || now - bucket.firstFailureAt > WINDOW_MS) {
    buckets.set(key, { failures: 1, firstFailureAt: now, lockedUntil: 0 })
    return
  }
  bucket.failures += 1
  if (bucket.failures >= MAX_FAILURES) bucket.lockedUntil = now + LOCK_MS
}

export function clearThrottleFailures(key: string): void {
  buckets.delete(key)
}