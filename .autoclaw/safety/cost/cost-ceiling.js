/**
 * .autoclaw/safety/cost/cost-ceiling.js
 * Enforce cost ceilings at multiple levels
 * Levels: per-run ($1), per-agent-day ($50), per-global-day ($500)
 */

class CostCeiling {
  /**
   * @param {Object} config
   * @param {number} [config.perRunCeiling] - Max per single run
   * @param {number} [config.perAgentDayCeiling] - Max per agent per day
   * @param {number} [config.globalDayCeiling] - Max globally per day
   */
  constructor({
    perRunCeiling = 1.0,
    perAgentDayCeiling = 50.0,
    globalDayCeiling = 500.0,
  } = {}) {
    this.perRunCeiling = perRunCeiling;
    this.perAgentDayCeiling = perAgentDayCeiling;
    this.globalDayCeiling = globalDayCeiling;

    // Track usage
    this.usage = {
      perAgent: new Map(), // agentId -> { cost, count, lastUpdated }
      globalToday: 0,
      dayStart: this.getTodayStart(),
    };
  }

  /**
   * Check if action is within cost limits
   * @param {Object} config
   * @param {string} [config.action] - Action name
   * @param {*} [config.params] - Action parameters
   * @param {Object} [config.actor] - Actor (has id)
   * @param {number} [config.estimatedCost] - Pre-calculated cost
   * @returns {Promise<{allowed, remaining, reason, requiresApproval}>}
   */
  async check({ action, params, actor, estimatedCost = 0 }) {
    // Reset daily counters if needed
    if (Date.now() - this.usage.dayStart > 86400000) {
      this.usage = {
        perAgent: new Map(),
        globalToday: 0,
        dayStart: this.getTodayStart(),
      };
    }

    const actorId = actor?.id || 'anonymous';

    // 1. Check per-run ceiling
    if (estimatedCost > this.perRunCeiling) {
      return {
        allowed: false,
        reason: `Run cost $${estimatedCost.toFixed(2)} exceeds per-run ceiling $${this.perRunCeiling}`,
        requiresApproval: true,
      };
    }

    // 2. Check per-agent daily ceiling
    const agentUsage = this.usage.perAgent.get(actorId) || { cost: 0, count: 0 };
    if (agentUsage.cost + estimatedCost > this.perAgentDayCeiling) {
      return {
        allowed: false,
        reason: `Agent ${actorId} daily cost would be $${(agentUsage.cost + estimatedCost).toFixed(2)}, exceeds ceiling $${this.perAgentDayCeiling}`,
        requiresApproval: true,
      };
    }

    // 3. Check global daily ceiling
    if (this.usage.globalToday + estimatedCost > this.globalDayCeiling) {
      return {
        allowed: false,
        reason: `Global daily cost would be $${(this.usage.globalToday + estimatedCost).toFixed(2)}, exceeds ceiling $${this.globalDayCeiling}`,
        requiresApproval: false, // Cannot approve global ceiling
      };
    }

    // Within limits
    const remaining = this.globalDayCeiling - this.usage.globalToday - estimatedCost;

    return {
      allowed: true,
      remaining: Number(remaining.toFixed(2)),
      requiresApproval: false,
    };
  }

  /**
   * Record actual cost
   * @param {Object} config
   * @param {string} [config.action]
   * @param {Object} [config.actor]
   * @param {number} config.cost - Actual cost incurred
   * @returns {void}
   */
  record({ action, actor, cost }) {
    const actorId = actor?.id || 'anonymous';

    // Update global
    this.usage.globalToday += cost;

    // Update per-agent
    const agentUsage = this.usage.perAgent.get(actorId) || { cost: 0, count: 0 };
    agentUsage.cost += cost;
    agentUsage.count += 1;
    agentUsage.lastUpdated = Date.now();
    this.usage.perAgent.set(actorId, agentUsage);
  }

  /**
   * Get cost status
   * @returns {Object}
   */
  status() {
    return {
      perRunCeiling: this.perRunCeiling,
      perAgentDayCeiling: this.perAgentDayCeiling,
      globalDayCeiling: this.globalDayCeiling,
      globalToday: Number(this.usage.globalToday.toFixed(2)),
      globalRemaining: Number((this.globalDayCeiling - this.usage.globalToday).toFixed(2)),
      perAgent: Object.fromEntries(
        Array.from(this.usage.perAgent.entries()).map(([id, u]) => [
          id,
          {
            cost: Number(u.cost.toFixed(2)),
            count: u.count,
            average: Number((u.cost / u.count).toFixed(2)),
          },
        ]),
      ),
      dayStart: this.usage.dayStart,
      dayRemainingMs: Math.max(0, 86400000 - (Date.now() - this.usage.dayStart)),
    };
  }

  /**
   * Get remaining budget for agent
   * @param {string} actorId
   * @returns {number}
   */
  getRemainingForAgent(actorId) {
    const agentUsage = this.usage.perAgent.get(actorId) || { cost: 0 };
    return Math.max(0, this.perAgentDayCeiling - agentUsage.cost);
  }

  /**
   * Get timestamp for start of today (UTC)
   * @private
   * @returns {number}
   */
  getTodayStart() {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime();
  }

  /**
   * Reset all tracking (for testing)
   */
  reset() {
    this.usage = {
      perAgent: new Map(),
      globalToday: 0,
      dayStart: this.getTodayStart(),
    };
  }
}

;

export { CostCeiling };
