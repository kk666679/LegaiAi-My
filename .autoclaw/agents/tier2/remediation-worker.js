import { BaseAgent } from '../base-agent.js';

import { toolRegistry } from '../../tools/registry.js;

/**
 * agents/tier2/remediation-worker.js — Tier 2: Remediation worker.
 */
Object.defineProperty(exports, "__esModule", { value: true })';

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

    const t = toolRegistry.get(tool);
    if (!t) throw new Error(`Tool ${tool} not registered`);
    return t.handler(input, this.deps);
  }
}

export { RemediationWorker as RemediationWorker };
