"use strict";
/**
 * agents/tier1/content/content-agent.js — Tier 1: Content generation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { BaseAgent } = require('../../base-agent');

class ContentAgent extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'content-agent',
      role: 'content-generator',
      tier: 1,
      capabilities: [
        'content.generate',
        'content.optimize',
        'content.schedule',
      ],
      skills: ['generate-post', 'validate-output', 'reflect-on-outcome'],
      tools: ['content.create', 'content.publish', 'schedule.create'],
      memoryConfig: { stmCapacity: 300, stmTokenBudget: 12000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    const { memory, skills } = context;
    const generateSkill = this.skills.get('generate-post');

    return {
      goal,
      steps: [
        {
          skill: 'generate-post',
          input: { topic: goal, platform: context.platform, tone: context.tone },
          description: 'Generate content post',
        },
        {
          tool: 'content.create',
          input: { content: '$step1.output', platform: context.platform },
          description: 'Create content draft',
        },
      ],
      memoryUsed: 0,
      skillGuidance: generateSkill?.instructions,
    };
  }

  async invokeTool(tool, input) {
    const { toolRegistry } = require('../../../tools/registry');
    const t = toolRegistry.get(tool);
    if (!t) throw new Error(`Tool ${tool} not registered`);
    return t.handler(input, this.deps);
  }
}

exports.ContentAgent = ContentAgent;