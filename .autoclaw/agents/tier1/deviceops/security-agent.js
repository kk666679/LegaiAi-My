import { BaseAgent } from '../../base-agent.js';

import { toolRegistry } from '../../../tools/registry.js;

/**
 * agents/tier1/deviceops/security-agent.js — Tier 1: Security monitoring.
 */
Object.defineProperty(exports, "__esModule", { value: true })';

class SecurityAgent extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'security-agent',
      role: 'security-monitor',
      tier: 1,
      capabilities: [
        'security.scan',
        'security.audit',
        'security.remediate',
      ],
      skills: ['validate-output', 'reflect-on-outcome'],
      tools: ['security.scan', 'security.audit', 'alert.create'],
      memoryConfig: { stmCapacity: 300, stmTokenBudget: 10000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    return {
      goal,
      steps: [
        {
          tool: 'security.scan',
          input: { scope: context.scope ?? 'all' },
          description: 'Run security scan',
        },
        {
          tool: 'security.audit',
          input: { findings: '$step1.output' },
          description: 'Audit scan findings',
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

export { SecurityAgent as SecurityAgent };
