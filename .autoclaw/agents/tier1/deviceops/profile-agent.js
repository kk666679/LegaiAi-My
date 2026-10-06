import { BaseAgent } from '../../base-agent.js';

import { toolRegistry } from '../../../tools/registry.js';

/**
 * agents/tier1/deviceops/profile-agent.js — Tier 1: Profile and policy management.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class ProfileAgent extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'profile-agent',
      role: 'profile-manager',
      tier: 1,
      capabilities: [
        'profile.create',
        'profile.update',
        'profile.compare',
      ],
      skills: ['compare-profiles', 'validate-output', 'reflect-on-outcome'],
      tools: ['profile.read', 'profile.write', 'profile.diff'],
      memoryConfig: { stmCapacity: 200, stmTokenBudget: 8000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    const { memory, skills } = context;
    const compareSkill = this.skills.get('compare-profiles');

    return {
      goal,
      steps: [
        {
          tool: 'profile.read',
          input: { profileId: context.profileId },
          description: 'Read current profile',
        },
        {
          skill: 'compare-profiles',
          input: { base: context.baseProfile, target: context.targetProfile },
          description: 'Compare profiles for differences',
        },
        {
          tool: 'profile.write',
          input: { profileId: context.profileId, updates: '$step2.output' },
          description: 'Apply profile updates',
        },
      ],
      memoryUsed: memory.memoriesIncluded,
      skillGuidance: compareSkill?.instructions,
    };
  }

  async invokeTool(tool, input) {

    const t = toolRegistry.get(tool);
    if (!t) throw new Error(`Tool ${tool} not registered`);
    return t.handler(input, this.deps);
  }
}

export { ProfileAgent as ProfileAgent };
