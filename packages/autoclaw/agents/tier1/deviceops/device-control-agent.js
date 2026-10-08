import { BaseAgent } from '../../base-agent.js';

import { toolRegistry } from '../../../tools/registry.js';

/**
 * agents/tier1/deviceops/device-control-agent.js — Tier 1: Device control.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class DeviceControlAgent extends BaseAgent {
  constructor(deps = {}) {
    super({
      id: 'device-control-agent',
      role: 'device-control',
      tier: 1,
      capabilities: [
        'device.reboot',
        'device.command',
        'device.config',
      ],
      skills: ['validate-output', 'reflect-on-outcome'],
      tools: ['device.reboot', 'device.shell', 'device.config'],
      memoryConfig: { stmCapacity: 200, stmTokenBudget: 8000 },
    });
    this.deps = deps;
  }

  async plan(goal, context) {
    return {
      goal,
      steps: [
        {
          tool: 'device.shell',
          input: { deviceId: context.deviceId, command: context.command },
          description: 'Execute shell command on device',
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

export { DeviceControlAgent as DeviceControlAgent };
