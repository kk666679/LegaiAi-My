import { PolicyEngine } from './policy-engine.js';
import { RateLimiter } from './rate-limiter.js';
import { QuotaManager } from './quota-manager.js';

export class Governance {
  constructor({ rules = [] } = {}) {
    this.policy = new PolicyEngine({ rules });
    this.rateLimiter = new RateLimiter();
    this.quota = new QuotaManager();
  }

  async check({ task, requestingAgent, context }) {
    await this.rateLimiter.check(requestingAgent);
    return this.policy.check({ task, requestingAgent, context });
  }
}
