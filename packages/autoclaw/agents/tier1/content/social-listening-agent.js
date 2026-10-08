import { BaseAgent } from '../../base-agent.js';

import { toolRegistry } from '../../../tools/registry.js';

/**
 * agents/tier1/content/social-listening-agent.js — Tier 1: Social media listening.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class SocialListeningAgent extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'social-listening-agent',
      role: 'social-listener',
      tier: 1,
      capabilities: [
        'social.monitor',
        'social.analyze',
        'social.alert',
      ],
      skills: ['validate-output', 'reflect-on-outcome'],
      tools: ['social.stream', 'social.analyze', 'alert.create'],
      memoryConfig: { stmCapacity: 300, stmTokenBudget: 10000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    return {
      goal,
      steps: [
        {
          tool: 'social.stream',
          input: { keywords: context.keywords, platforms: context.platforms },
          description: 'Stream social mentions',
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

export { SocialListeningAgent as SocialListeningAgent };
