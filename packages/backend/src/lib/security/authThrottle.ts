/**
 * In-process credential-stuffing throttle for the public auth procedures.
 *
 * The global HTTP limiter in server.ts only bounds a single IP at 120 req/min;
 * it does nothing against a botnet, and it is per-process, so it neither
 * survives a restart nor spans instances. This module adds account-aware
 * failure counters so repeated password guesses against one account lock out
 * however the requests are distributed.
 *
 * Every key is namespaced per procedure. Sharing one counter between signup,
 * register and createOrg let a single user's failed attempt lock every other
 * user out of all three.
 *
 * State is deliberately in-process: it is a defence-in-depth control, not an
 * audit record. Swap for Redis if the backend is ever run multi-instance.
 */

const MAX_BUCKETS = 10_000

export interface ThrottlePolicy {
  /** Consecutive non-successes tolerated before the key is locked. */
  limit: number
  /** Window in which those failures accumulate. */
  windowMs: number
  /** How long the key stays locked once the limit is reached. */
  lockMs: number
}

export const LOGIN_POLICY: ThrottlePolicy = { limit: 5, windowMs: 15 * 60_000, lockMs: 15 * 60_000 }

/**
 * Onboarding endpoints are per-IP and deliberately more generous: their
 * legitimate failure modes (email already taken, mistyped org slug) are not
 * abuse, so a low limit would punish real users on shared office egress.
 */
export const SIGNUP_POLICY: ThrottlePolicy = { limit: 10, windowMs: 15 * 60_000, lockMs: 15 * 60_000 }

interface Bucket {
  failures: number
  firstFailureAt: number
  windowMs: number
  lockedUntil: number
}

const buckets = new Map<string, Bucket>()

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.lockedUntil <= now && bucket.firstFailureAt + bucket.windowMs <= now) buckets.delete(key)
  }
  // Bound memory against unbounded key growth. Never evict an active lockout —
  // otherwise an unauthenticated caller could spray distinct keys, push the map
  // past MAX_BUCKETS and flush a victim's still-registered lock.
  if (buckets.size > MAX_BUCKETS) {
    const excess = buckets.size - MAX_BUCKETS
    let removed = 0
    for (const [key, bucket] of buckets) {
      if (removed >= excess) break
      if (bucket.lockedUntil > now) continue
      buckets.delete(key)
      removed += 1
    }
  }
}

function normalize(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Account-only bucket. Independent of the caller's address on purpose: this is
 * the one that has to hold when guesses are spread across many source IPs, and
 * it is also what stops a spoofed address from buying an attacker a fresh set
 * of attempts.
 */
export function loginAccountKey(email: string): string {
  return `acct|${normalize(email)}`
}

/** Per-(address, account) bucket: blunts spraying one account from many IPs. */
export function loginAddressKey(ip: string | undefined, email: string): string {
  return `login|${ip ?? 'unknown'}|${normalize(email)}`
}

export function signupKey(ip: string | undefined): string {
  return `signup|${ip ?? 'unknown'}`
}

export function registerKey(ip: string | undefined): string {
  return `register|${ip ?? 'unknown'}`
}

export function orgKey(ip: string | undefined, slug: string): string {
  return `org|${ip ?? 'unknown'}|${slug.trim().toLowerCase()}`
}

/** Remaining lockout in ms, or 0 when the key may attempt authentication. */
export function throttleRetryAfterMs(key: string, policy: ThrottlePolicy): number {
  const bucket = buckets.get(key)
  if (!bucket) return 0
  return Math.max(0, bucket.lockedUntil - Date.now())
}

export function isThrottled(key: string, policy: ThrottlePolicy): boolean {
  return throttleRetryAfterMs(key, policy) > 0
}

export function recordThrottleFailure(key: string, policy: ThrottlePolicy): void {
  const now = Date.now()
  prune(now)
  const bucket = buckets.get(key)
  if (!bucket || now - bucket.firstFailureAt > policy.windowMs) {
    buckets.set(key, { failures: 1, firstFailureAt: now, windowMs: policy.windowMs, lockedUntil: 0 })
    return
  }
  bucket.failures += 1
  if (bucket.failures >= policy.limit) bucket.lockedUntil = now + policy.lockMs
}

/** Clears every bucket a successful attempt should forgive. */
export function clearThrottleFailures(keys: string[]): void {
  for (const key of keys) buckets.delete(key)
}