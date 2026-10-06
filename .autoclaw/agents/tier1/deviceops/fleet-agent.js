import { BaseAgent } from '../../base-agent.js';

import { toolRegistry } from '../../../tools/registry.js;

/**
 * agents/tier1/deviceops/fleet-agent.js — Tier 1: Fleet monitoring and management.
 */
Object.defineProperty(exports, "__esModule", { value: true })';

class FleetAgent extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'fleet-agent',
      role: 'fleet-monitor',
      tier: 1,
      capabilities: [
        'fleet.summary',
        'fleet.diagnose',
        'fleet.alert',
        'device.list',
        'device.telemetry',
      ],
      skills: ['diagnose-device', 'validate-output', 'reflect-on-outcome'],
      tools: ['device.list', 'device.telemetry', 'alert.create'],
      memoryConfig: { stmCapacity: 300, stmTokenBudget: 10000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    const { memory, skills } = context;
    const diagnoseSkill = this.skills.get('diagnose-device');

    return {
      goal,
      steps: [
        {
          tool: 'device.list',
          input: context.filters ?? {},
          description: 'List devices matching filters',
        },
        {
          tool: 'device.telemetry',
          input: { deviceIds: context.deviceIds ?? [] },
          description: 'Fetch recent telemetry',
        },
        {
          skill: 'diagnose-device',
          input: { telemetry: '$step2.output' },
          description: 'Apply diagnosis skill',
        },
      ],
      memoryUsed: memory.memoriesIncluded,
      skillGuidance: diagnoseSkill?.instructions,
    };
  }

  async invokeTool(tool, input) {

    const t = toolRegistry.get(tool);
    if (!t) throw new Error(`Tool ${tool} not registered`);
    return t.handler(input, this.deps);
  }

  async reflect({ goal, plan, result }) {
    const degradations = result.results?.filter((r) => r.output?.status === 'degraded') ?? [];
    return {
      learned: degradations.length > 0
        ? [`${degradations.length} devices degraded during fleet scan`]
        : [],
      improvements: [],
    };
  }
}

export { FleetAgent as FleetAgent };
