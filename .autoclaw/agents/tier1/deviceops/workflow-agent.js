import { BaseAgent } from '../../base-agent.js';

import { toolRegistry } from '../../../tools/registry.js';

/**
 * agents/tier1/deviceops/workflow-agent.js — Tier 1: Workflow orchestration.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class WorkflowAgent extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'workflow-agent',
      role: 'workflow-orchestrator',
      tier: 1,
      capabilities: [
        'workflow.start',
        'workflow.monitor',
        'workflow.retry',
      ],
      skills: ['decompose-goal', 'plan-task', 'validate-output', 'reflect-on-outcome'],
      tools: ['workflow.create', 'workflow.status', 'workflow.retry'],
      memoryConfig: { stmCapacity: 300, stmTokenBudget: 12000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    const { memory, skills } = context;
    const decomposeSkill = this.skills.get('decompose-goal');
    const planSkill = this.skills.get('plan-task');

    return {
      goal,
      steps: [
        {
          skill: 'decompose-goal',
          input: { goal, context: context.workflowContext },
          description: 'Decompose workflow goal into steps',
        },
        {
          skill: 'plan-task',
          input: { goal: 'Execute workflow', context: { steps: '$step1.output.steps' } },
          description: 'Plan execution of workflow steps',
        },
        {
          tool: 'workflow.create',
          input: { steps: '$step2.output.steps' },
          description: 'Create workflow execution',
        },
      ],
      memoryUsed: 0,
      skillGuidance: decomposeSkill?.instructions,
    };
  }

  async invokeTool(tool, input) {

    const t = toolRegistry.get(tool);
    if (!t) throw new Error(`Tool ${tool} not registered`);
    return t.handler(input, this.deps);
  }
}

export { WorkflowAgent as WorkflowAgent };
