/**
 * @lawmate/safety — Rate limiting and resource controls.
 */
export interface RateLimiter {
  check(actorId: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number };
}

export class InMemoryRateLimiter implements RateLimiter {
  private counters = new Map<string, { count: number; resetAt: number }>();

  check(actorId: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.counters.get(actorId);

    if (!entry || now > entry.resetAt) {
      this.counters.set(actorId, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    entry.count += 1;
    const remaining = Math.max(0, limit - entry.count);
    return {
      allowed: entry.count <= limit,
      remaining,
      resetAt: entry.resetAt,
    };
  }
}

export function createRateLimiter(): RateLimiter {
  return new InMemoryRateLimiter();
}

export interface ResourceLimiter {
  acquire(actorId: string, resource: string, amount: number, limit: number): boolean;
  release(actorId: string, resource: string, amount: number): void;
}

export class InMemoryResourceLimiter implements ResourceLimiter {
  private usage = new Map<string, Map<string, number>>();

  acquire(actorId: string, resource: string, amount: number, limit: number): boolean {
    const actorMap = this.usage.get(actorId) || new Map();
    const current = actorMap.get(resource) || 0;
    if (current + amount > limit) return false;
    actorMap.set(resource, current + amount);
    this.usage.set(actorId, actorMap);
    return true;
  }

  release(actorId: string, resource: string, amount: number): void {
    const actorMap = this.usage.get(actorId);
    if (!actorMap) return;
    const current = actorMap.get(resource) || 0;
    actorMap.set(resource, Math.max(0, current - amount));
  }
}

export function createResourceLimiter(): ResourceLimiter {
  return new InMemoryResourceLimiter();
}