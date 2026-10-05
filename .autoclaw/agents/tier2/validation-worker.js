"use strict";
/**
 * agents/tier2/validation-worker.js — Tier 2: Validation worker.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { BaseAgent } = require('../base-agent');

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
    const { toolRegistry } = require('../../tools/registry');
    const t = toolRegistry.get(tool);
    if (!t) throw new Error(`Tool ${tool} not registered`);
    return t.handler(input, this.deps);
  }
}

exports.ValidationWorker = ValidationWorker;