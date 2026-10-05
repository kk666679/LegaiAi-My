import { RunCeiling } from './enforcement/run-ceiling.js';
import { AgentCeiling } from './enforcement/agent-ceiling.js';
import { GlobalCeiling } from './enforcement/global-ceiling.js';
import { TierCeiling } from './enforcement/tier-ceiling.js';
import { CostLedger } from './tracking/ledger.js';
import { RealtimeTracker } from './tracking/realtime.js';

export class BudgetExceededError extends Error {
  constructor({ type, used, limit }) {
    super(`Budget exceeded: ${type} (${used.toFixed(2)}/${limit.toFixed(2)})`);
    this.name = 'BudgetExceededError';
    this.type = type;
    this.used = used;
    this.limit = limit;
  }
}

export class BudgetEnforcer {
  constructor({ config = {} } = {}) {
    this.config = {
      perRun: config.perRun ?? 1.0,
      perAgentDay: config.perAgentDay ?? 50.0,
      globalDay: config.globalDay ?? 500.0,
      tierLimits: config.tierLimits ?? {},
      ledgerPath: config.ledgerPath ?? '.autoclaw/budget/ledger.jsonl',
    };

    this.runCeiling = new RunCeiling({ limit: this.config.perRun });
    this.agentCeiling = new AgentCeiling({ limit: this.config.perAgentDay });
    this.globalCeiling = new GlobalCeiling({ limit: this.config.globalDay });
    this.tierCeiling = new TierCeiling({ tierLimits: this.config.tierLimits });
    this.ledger = new CostLedger({ path: this.config.ledgerPath });
    this.realtime = new RealtimeTracker();
  }

  async check({ agentId, runId, estimatedCost, model, task }) {
    const checks = await Promise.all([
      this.runCeiling.check({ runId, estimatedCost }),
      this.agentCeiling.check({ agentId, estimatedCost }),
      this.globalCeiling.check({ estimatedCost }),
    ]);

    const failure = checks.find((c) => !c.ok);
    if (failure) {
      throw new BudgetExceededError(failure);
    }

    return { ok: true, remaining: this.remaining() };
  }

  async record({ agentId, runId, model, tokensIn, tokensOut, cost, metadata }) {
    const entry = {
      ts: Date.now(),
      agentId,
      runId,
      model,
      tokensIn,
      tokensOut,
      cost,
      metadata,
    };

    await this.ledger.append(entry);
    this.realtime.record(entry);
    this.agentCeiling.record({ agentId, cost });
    this.globalCeiling.record({ cost });

    return entry;
  }

  remaining() {
    return {
      global: this.globalCeiling.remaining(),
      perAgent: (agentId) => this.agentCeiling.remaining(agentId),
      percentUsed: (this.globalCeiling.used() / this.globalCeiling.limit) * 100,
    };
  }

  async summary({ window = '24h' } = {}) {
    const entries = await this.ledger.get({ limit: 10000 });
    const windowMs = this.parseWindow(window);
    const cutoff = Date.now() - windowMs;

    const filtered = entries.filter((e) => e.ts >= cutoff);

    return {
      window,
      total: filtered.reduce((sum, e) => sum + e.cost, 0),
      count: filtered.length,
      byAgent: this.groupByAgent(filtered),
      byModel: this.groupByModel(filtered),
      remaining: this.remaining(),
    };
  }

  async forecast({ window = '24h' }) {
    const summary = await this.summary({ window });
    const hourlyRate = summary.total / (this.parseWindow(window) / (1000 * 60 * 60));
    const hoursUntilExhausted = this.globalCeiling.remaining() / hourlyRate;

    return {
      hourlyRate: hourlyRate.toFixed(4),
      remaining: this.globalCeiling.remaining().toFixed(2),
      hoursUntilExhausted: hoursUntilExhausted.toFixed(1),
      daysUntilExhausted: (hoursUntilExhausted / 24).toFixed(2),
    };
  }

  groupByAgent(entries) {
    const groups = new Map();
    for (const entry of entries) {
      if (!groups.has(entry.agentId)) {
        groups.set(entry.agentId, { cost: 0, count: 0 });
      }
      const group = groups.get(entry.agentId);
      group.cost += entry.cost;
      group.count += 1;
    }
    return Object.fromEntries(groups);
  }

  groupByModel(entries) {
    const groups = new Map();
    for (const entry of entries) {
      if (!groups.has(entry.model)) {
        groups.set(entry.model, { cost: 0, count: 0 });
      }
      const group = groups.get(entry.model);
      group.cost += entry.cost;
      group.count += 1;
    }
    return Object.fromEntries(groups);
  }

  parseWindow(window) {
    const match = /^(\d+)([dhms])$/.exec(window);
    if (!match) return 24 * 60 * 60 * 1000; // default 24h
    const [, num, unit] = match;
    const n = parseInt(num, 10);
    switch (unit) {
      case 'd': return n * 24 * 60 * 60 * 1000;
      case 'h': return n * 60 * 60 * 1000;
      case 'm': return n * 60 * 1000;
      case 's': return n * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }
}
