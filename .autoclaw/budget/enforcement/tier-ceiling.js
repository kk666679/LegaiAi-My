import { BudgetExceededError } from '../index.js';

export class TierCeiling {
  constructor({ tierLimits = {} } = {}) {
    this.tierLimits = tierLimits;
    this.tierUsage = new Map();
  }

  async check({ agentId, estimatedCost, tierName }) {
    const tierLimit = this.tierLimits[tierName] || 0;
    const currentUsage = this.tierUsage.get(agentId) || 0;
    const newUsage = currentUsage + estimatedCost;

    return {
      ok: newUsage <= tierLimit,
      used: newUsage,
      limit: tierLimit,
      type: newUsage > tierLimit ? 'tier-ceiling' : 'ok'
    };
  }

  record({ agentId, cost, tierName }) {
    const currentUsage = this.tierUsage.get(agentId) || 0;
    const newUsage = currentUsage + cost;
    this.tierUsage.set(agentId, newUsage);
  }

  remaining(agentId, tierName) {
    const currentUsage = this.tierUsage.get(agentId) || 0;
    const tierLimit = this.tierLimits[tierName] || 0;
    return tierLimit - currentUsage;
  }
}