import { BaseAgent } from '../base-agent.js';

import { toolRegistry } from '../../tools/registry.js';

/**
 * agents/tier2/validation-worker.js — Tier 2: Validation and policy checks.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class ValidationWorker extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'validation-worker',
      role: 'validation',
      tier: 2,
      capabilities: [
        'validation.run',
        'validation.check',
      ],
      skills: ['validate-output'],
      tools: ['device.telemetry', 'device.logs'],
      memoryConfig: { stmCapacity: 150, stmTokenBudget: 5000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    return {
      goal,
      steps: [
        {
          skill: 'validate-output',
          input: { output: context.output, schema: context.schema },
          description: 'Validate output against schema',
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

export { ValidationWorker as ValidationWorker };
