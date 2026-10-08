import { BaseAgent } from '../base-agent.js';
import { board } from '../../orchestrator/board.js';

/**
 * agents/tier0/orchestrator-agent.js — Tier 0: Central orchestrator agent.
 *
 * The orchestrator agent coordinates the fleet, manages task assignments,
 * and maintains the global view of the system.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class OrchestratorAgent extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'orchestrator-agent',
      role: 'orchestrator',
      tier: 0,
      capabilities: [
        'fleet.summary',
        'fleet.assign',
        'sprint.plan',
        'orchestrator.claim',
        'orchestrator.review',
        'orchestrator.escalate',
      ],
      skills: ['plan-task', 'validate-output', 'reflect-on-outcome'],
      tools: ['board.read', 'board.write', 'claim.create', 'claim.assign'],
      memoryConfig: { stmCapacity: 500, stmTokenBudget: 20000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    const { memory, skills } = context;
    const planSkill = this.skills.get('plan-task');

    return {
      goal,
      steps: [
        {
          tool: 'board.read',
          input: { sprint: context.sprint },
          description: 'Read current sprint board',
        },
        {
          skill: 'plan-task',
          input: { goal, context: memory.text },
          description: 'Generate task breakdown and assignments',
        },
        {
          tool: 'claim.create',
          input: { taskIds: '$step2.output.taskIds' },
          description: 'Create claims for planned tasks',
        },
      ],
      memoryUsed: memory.memoriesIncluded,
      skillGuidance: planSkill?.instructions,
    };
  }

  async invokeTool(tool, input) {
    if (tool === 'board.read') {
      return board.getBoard(input.sprint);
    }
    if (tool === 'board.write') {
      return board.updateBoard(input);
    }
    if (tool === 'claim.create') {
      const { claim } = require('../orchestrator/claim');
      return claim.create(input);
    }
    if (tool === 'claim.assign') {
      const { claim } = require('../orchestrator/claim');
      return claim.assign(input.claimId, input.agentId);
    }
    throw new Error(`Tool ${tool} not implemented`);
  }

  async reflect({ goal, plan, result }) {
    const claimResults = result.results?.filter((r) => r.step === 'claim.create') ?? [];
    return {
      learned: claimResults.length > 0
        ? [`Created ${claimResults.length} claims for sprint`]
        : [],
      improvements: [],
    };
  }
}

export { OrchestratorAgent as OrchestratorAgent };
