import { BudgetExceededError } from '../index.js';

export class RunCeiling {
  constructor({ limit = 1.00 } = {}) {
    this.limit = limit;
  }

  async check({ runId, estimatedCost }) {
    // In a real implementation, this would check against run-specific limits
    // For now, we'll simulate a simple check
    return {
      ok: estimatedCost <= this.limit,
      used: estimatedCost,
      limit: this.limit,
      type: estimatedCost > this.limit ? 'run-ceiling' : 'ok'
    };
  }
}