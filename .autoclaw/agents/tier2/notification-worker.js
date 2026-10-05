"use strict";
/**
 * agents/tier2/notification-worker.js — Tier 2: Notification worker.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { BaseAgent } = require('../base-agent');

class NotificationWorker extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'notification-worker',
      role: 'notification',
      tier: 2,
      capabilities: [
        'notification.send',
        'notification.template',
      ],
      skills: ['validate-output'],
      tools: ['notification.send', 'notification.render'],
      memoryConfig: { stmCapacity: 100, stmTokenBudget: 4000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    return {
      goal,
      steps: [
        {
          tool: 'notification.render',
          input: { template: context.template, data: context.data },
          description: 'Render notification template',
        },
        {
          tool: 'notification.send',
          input: { content: '$step1.output', channel: context.channel },
          description: 'Send notification',
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

exports.NotificationWorker = NotificationWorker;