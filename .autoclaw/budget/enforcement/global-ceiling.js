import { BudgetExceededError } from '../index.js';

export class GlobalCeiling {
  constructor({ limit = 500.00 } = {}) {
    this.limit = limit;
    this.usage = 0;
  }

  async check({ estimatedCost }) {
    const newUsage = this.usage + estimatedCost;
    return {
      ok: newUsage <= this.limit,
      used: newUsage,
      limit: this.limit,
      type: newUsage > this.limit ? 'global-ceiling' : 'ok'
    };
  }

  record({ cost }) {
    this.usage += cost;
  }

  remaining() {
    return this.limit - this.usage;
  }

  used() {
    return this.usage;
  }
}