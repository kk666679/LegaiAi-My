import { BaseAgent } from '../base-agent.js';

import { toolRegistry } from '../../tools/registry.js';

/**
 * agents/tier2/compliance-worker.js — Tier 2: Compliance automation.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class ComplianceWorker extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'compliance-worker',
      role: 'compliance',
      tier: 2,
      capabilities: [
        'compliance.check',
        'compliance.audit',
      ],
      skills: ['validate-output'],
      tools: ['compliance.scan', 'compliance.report'],
      memoryConfig: { stmCapacity: 150, stmTokenBudget: 5000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    return {
      goal,
      steps: [
        {
          tool: 'compliance.scan',
          input: { scope: context.scope ?? 'all' },
          description: 'Run compliance scan',
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

export { ComplianceWorker as ComplianceWorker };
