"use strict";
/**
 * agents/tier2/diagnostic-worker.js — Tier 2: Diagnostic worker.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { BaseAgent } = require('../base-agent');

class DiagnosticWorker extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'diagnostic-worker',
      role: 'diagnostic',
      tier: 2,
      capabilities: [
        'diagnostic.run',
        'diagnostic.analyze',
      ],
      skills: ['diagnose-device', 'validate-output'],
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
          tool: 'device.telemetry',
          input: { deviceId: context.deviceId },
          description: 'Fetch telemetry for diagnosis',
        },
        {
          skill: 'diagnose-device',
          input: { telemetry: '$step1.output' },
          description: 'Run diagnostic skill',
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

exports.DiagnosticWorker = DiagnosticWorker;