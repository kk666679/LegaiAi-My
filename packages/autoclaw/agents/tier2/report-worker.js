import { BaseAgent } from '../base-agent.js';

import { toolRegistry } from '../../tools/registry.js';

/**
 * agents/tier2/report-worker.js — Tier 2: Reporting and summarization.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class ReportWorker extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'report-worker',
      role: 'report-generator',
      tier: 2,
      capabilities: [
        'report.generate',
        'report.format',
      ],
      skills: ['validate-output', 'reflect-on-outcome'],
      tools: ['report.create', 'report.export'],
      memoryConfig: { stmCapacity: 200, stmTokenBudget: 8000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    return {
      goal,
      steps: [
        {
          tool: 'report.create',
          input: { data: context.data, format: context.format ?? 'markdown' },
          description: 'Generate report',
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

export { ReportWorker as ReportWorker };
