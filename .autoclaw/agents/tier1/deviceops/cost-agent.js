import { BaseAgent } from '../../base-agent.js';

import { toolRegistry } from '../../../tools/registry.js';

/**
 * agents/tier1/deviceops/cost-agent.js — Tier 1: Cost and utilisation insights.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class CostAgent extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'cost-agent',
      role: 'cost-optimizer',
      tier: 1,
      capabilities: [
        'cost.track',
        'cost.optimize',
        'cost.report',
      ],
      skills: ['validate-output', 'reflect-on-outcome'],
      tools: ['cost.read', 'cost.analyze', 'budget.check'],
      memoryConfig: { stmCapacity: 200, stmTokenBudget: 8000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    return {
      goal,
      steps: [
        {
          tool: 'cost.read',
          input: { period: context.period ?? 'monthly' },
          description: 'Read cost data for period',
        },
        {
          tool: 'cost.analyze',
          input: { data: '$step1.output' },
          description: 'Analyze cost patterns',
        },
      ],
      memoryUsed: 0,
    };
  }

  async invokeTool(tool, input) {

    const t = toolRegistry.get(tool);
    if (!t) throw new Error(`Tool ${tool} not registered`);
    return t.handler(input, this.deps);
  }
}

export { CostAgent as CostAgent };
