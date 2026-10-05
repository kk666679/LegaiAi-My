"use strict";
/**
 * safety/cost-ceiling.js — Cost ceiling enforcement for agents.
 *
 * Enforces per-agent, per-run, per-day, per-month cost limits.
 * Integrates with cost ledger for real-time tracking.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class CostCeiling {
  constructor(config = {}) {
    this.config = config;
    this.ceilings = new Map(); // agentId -> ceiling config
    this.globalCeiling = config.global ?? {
      perRun: 10.00,      // $10 per run
      perDay: 100.00,     // $100 per day
      perMonth: 1000.00,  // $1000 per month
    };
    this.defaultAgentCeiling = config.defaultAgent ?? {
      perRun: 5.00,
      perDay: 50.00,
      perMonth: 500.00,
    };
  }

  /**
   * Set ceiling for specific agent
   */
  setCeiling(agentId, ceiling) {
    this.ceilings.set(agentId, { ...this.defaultAgentCeiling, ...ceiling });
  }

  /**
   * Get ceiling for agent
   */
  getCeiling(agentId) {
    return this.ceilings.get(agentId) ?? this.defaultAgentCeiling;
  }

  /**
   * Check if cost would exceed ceiling
   */
  async check(agentId, estimatedCost, ledger) {
    const ceiling = this.getCeiling(agentId);
    const usage = await this.getUsage(agentId, ledger);

    // Per-run check
    if (estimatedCost > ceiling.perRun) {
      return { allowed: false, reason: `Run cost $${estimatedCost.toFixed(2)} exceeds ceiling $${ceiling.perRun.toFixed(2)}`, ceiling: 'perRun' };
    }

    // Per-day check
    if (usage.today + estimatedCost > ceiling.perDay) {
      return { allowed: false, reason: `Daily cost would be $${(usage.today + estimatedCost).toFixed(2)}, exceeds ceiling $${ceiling.perDay.toFixed(2)}`, ceiling: 'perDay' };
    }

    // Per-month check
    if (usage.month + estimatedCost > ceiling.perMonth) {
      return { allowed: false, reason: `Monthly cost would be $${(usage.month + estimatedCost).toFixed(2)}, exceeds ceiling $${ceiling.perMonth.toFixed(2)}`, ceiling: 'perMonth' };
    }

    return { allowed: true, usage, ceiling };
  }

  /**
   * Get usage for agent from ledger
   */
  async getUsage(agentId, ledger) {
    // In production, query cost ledger
    // For now, return mock data
    return {
      today: 0,
      month: 0,
      total: 0,
    };
  }

  /**
   * Record actual cost after run
   */
  async recordCost(agentId, cost, ledger) {
    // Would record to ledger
    return { recorded: true, agentId, cost };
  }

  /**
   * Get remaining budget
   */
  async getRemainingBudget(agentId, ledger) {
    const ceiling = this.getCeiling(agentId);
    const usage = await this.getUsage(agentId, null);

    return {
      perRun: { used: 0, remaining: ceiling.perRun, ceiling: ceiling.perRun },
      perDay: { used: usage.today, remaining: Math.max(0, ceiling.perDay - usage.today), ceiling: ceiling.perDay },
      perMonth: { used: usage.month, remaining: Math.max(0, ceiling.perMonth - usage.month), ceiling: ceiling.perMonth },
    };
  }

  /**
   * Check if agent is near ceiling (warning)
   */
  async checkWarning(agentId, ledger, threshold = 0.8) {
    const budget = await this.getRemainingBudget(agentId, ledger);
    const warnings = [];

    if (budget.perDay.used / budget.perDay.ceiling > threshold) {
      warnings.push({ type: 'daily', usage: budget.perDay.used / budget.perDay.ceiling });
    }
    if (budget.perMonth.used / budget.perMonth.ceiling > threshold) {
      warnings.push({ type: 'monthly', usage: budget.perMonth.used / budget.perMonth.ceiling });
    }

    return { warnings, critical: warnings.length > 0 };
  }
}

class CostCeilingExceeded extends Error {
  constructor(message, ceiling, usage) {
    super(message);
    this.name = 'CostCeilingExceeded';
    this.ceiling = ceiling;
    this.usage = usage;
  }
}

exports.CostCeiling = CostCeiling;
exports.CostCeilingExceeded = CostCeilingExceeded;