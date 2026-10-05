"use strict";
/**
 * agents/tier2/remediation-worker.js — Tier 2: Remediation worker.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { BaseAgent } = require('../base-agent');

class RemediationWorker extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'remediation-worker',
      role: 'remediation',
      tier: 2,
      capabilities: [
        'remediation.run',
        'remediation.verify',
      ],
      skills: ['remediate-degraded', 'validate-output'],
      tools: ['device.reboot', 'device.shell', 'device.config'],
      memoryConfig: { stmCapacity: 150, stmTokenBudget: 5000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    return {
      goal,
      steps: [
        {
          skill: 'remediate-degraded',
          input: { deviceId: context.deviceId, diagnosis: context.diagnosis },
          description: 'Apply remediation',
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

exports.RemediationWorker = RemediationWorker;