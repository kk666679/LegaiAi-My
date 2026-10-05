export class RateLimiter {
  constructor({ defaultLimit = 100 } = {}) {
    this.defaultLimit = defaultLimit;
    this.limits = new Map();
  }

  async check(agentId) {
    const limit = this.limits.get(agentId) ?? { count: 0, resetAt: Date.now() + 60000 };
    if (Date.now() > limit.resetAt) {
      limit.count = 0;
      limit.resetAt = Date.now() + 60000;
    }
    limit.count++;
    this.limits.set(agentId, limit);
    if (limit.count > this.defaultLimit) {
      throw new Error(`Rate limit exceeded for ${agentId}`);
    }
  }

  setLimit(agentId, limit) {
    this.limits.set(agentId, { ...this.limits.get(agentId), limit });
  }
}
