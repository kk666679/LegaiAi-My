"use strict";
/**
 * agents/tier1/deviceops/provisioning-agent.js — Tier 1: Device provisioning.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { BaseAgent } = require('../../base-agent');

class ProvisioningAgent extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'provisioning-agent',
      role: 'provisioning',
      tier: 1,
      capabilities: [
        'device.provision',
        'device.enroll',
        'profile.apply',
      ],
      skills: ['provision-device', 'validate-output', 'reflect-on-outcome'],
      tools: ['device.enroll', 'profile.apply', 'alert.create'],
      memoryConfig: { stmCapacity: 200, stmTokenBudget: 8000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    const { memory, skills } = context;
    const provisionSkill = this.skills.get('provision-device');

    return {
      goal,
      steps: [
        {
          tool: 'device.enroll',
          input: { deviceId: context.deviceId, config: context.config },
          description: 'Enroll new device',
        },
        {
          skill: 'provision-device',
          input: { deviceId: context.deviceId, profile: context.profile },
          description: 'Apply provisioning profile',
        },
        {
          tool: 'alert.create',
          input: { type: 'provisioned', deviceId: context.deviceId },
          description: 'Notify provisioning complete',
        },
      ],
      memoryUsed: memory.memoriesIncluded,
      skillGuidance: provisionSkill?.instructions,
    };
  }

  async invokeTool(tool, input) {
    const { toolRegistry } = require('../../../tools/registry');
    const t = toolRegistry.get(tool);
    if (!t) throw new Error(`Tool ${tool} not registered`);
    return t.handler(input, this.deps);
  }
}

exports.ProvisioningAgent = ProvisioningAgent;