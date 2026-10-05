"use strict";
/**
 * agents/tier1/deviceops/security-agent.js — Tier 1: Security monitoring.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { BaseAgent } = require('../../base-agent');

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
    const { toolRegistry } = require('../../../tools/registry');
    const t = toolRegistry.get(tool);
    if (!t) throw new Error(`Tool ${tool} not registered`);
    return t.handler(input, this.deps);
  }
}

exports.SecurityAgent = SecurityAgent;