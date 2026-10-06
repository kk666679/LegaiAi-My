import { BaseAgent } from '../../base-agent.js';

import { toolRegistry } from '../../../tools/registry.js;

/**
 * agents/tier1/content/video-agent.js — Tier 1: Video content generation.
 */
Object.defineProperty(exports, "__esModule", { value: true })';

class VideoAgent extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'video-agent',
      role: 'video-generator',
      tier: 1,
      capabilities: [
        'video.script',
        'video.edit',
        'video.publish',
      ],
      skills: ['generate-video-script', 'validate-output', 'reflect-on-outcome'],
      tools: ['video.script', 'video.render', 'video.publish'],
      memoryConfig: { stmCapacity: 300, stmTokenBudget: 15000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    const { skills } = context;
    const scriptSkill = this.skills.get('generate-video-script');

    return {
      goal,
      steps: [
        {
          skill: 'generate-video-script',
          input: { topic: goal, style: context.style, duration: context.duration },
          description: 'Generate video script',
        },
      ],
      memoryUsed: 0,
      skillGuidance: scriptSkill?.instructions,
    };
  }

  async invokeTool(tool, input) {

    const t = toolRegistry.get(tool);
    if (!t) throw new Error(`Tool ${tool} not registered`);
    return t.handler(input, this.deps);
  }
}

export { VideoAgent as VideoAgent };
