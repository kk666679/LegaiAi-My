"use strict";
/**
 * agents/tier1/content/scheduling-agent.js — Tier 1: Content scheduling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { BaseAgent } = require('../../base-agent');

class SchedulingAgent extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'scheduling-agent',
      role: 'content-scheduler',
      tier: 1,
      capabilities: [
        'schedule.create',
        'schedule.optimize',
        'schedule.publish',
      ],
      skills: ['schedule-adaptive', 'validate-output', 'reflect-on-outcome'],
      tools: ['schedule.create', 'schedule.read', 'schedule.publish'],
      memoryConfig: { stmCapacity: 200, stmTokenBudget: 8000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    const { skills } = context;
    const scheduleSkill = this.skills.get('schedule-adaptive');

    return {
      goal,
      steps: [
        {
          skill: 'schedule-adaptive',
          input: { posts: context.posts, audience: context.audience },
          description: 'Generate adaptive schedule',
        },
      ],
      memoryUsed: 0,
      skillGuidance: scheduleSkill?.instructions,
    };
  }

  async invokeTool(tool, input) {
    const { toolRegistry } = require('../../../tools/registry');
    const t = toolRegistry.get(tool);
    if (!t) throw new Error(`Tool ${tool} not registered`);
    return t.handler(input, this.deps);
  }
}

exports.SchedulingAgent = SchedulingAgent;