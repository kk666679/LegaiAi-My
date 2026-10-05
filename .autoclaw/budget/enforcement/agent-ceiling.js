import { BudgetExceededError } from '../index.js';

export class AgentCeiling {
  constructor({ limit = 50.00 } = {}) {
    this.limit = limit;
    this.agentUsage = new Map();
  }

  async check({ agentId, estimatedCost }) {
    const currentUsage = this.agentUsage.get(agentId) || 0;
    const newUsage = currentUsage + estimatedCost;
    
    return {
      ok: newUsage <= this.limit,
      used: newUsage,
      limit: this.limit,
      type: newUsage > this.limit ? 'agent-ceiling' : 'ok'
    };
  }

  record({ agentId, cost }) {
    const currentUsage = this.agentUsage.get(agentId) || 0;
    const newUsage = currentUsage + cost;
    this.agentUsage.set(agentId, newUsage);
  }

  remaining(agentId) {
    const currentUsage = this.agentUsage.get(agentId) || 0;
    return this.limit - currentUsage;
  }
}