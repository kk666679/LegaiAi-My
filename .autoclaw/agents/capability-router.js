import { agentRegistry } from './registry.js';

/**
 * agents/capability-router.js — Route tasks to agents by capability.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class CapabilityRouter {
  constructor({ registry = agentRegistry } = {}) {
    this.registry = registry;
  }

  findAgentFor(intent) {
    const candidates = this.registry.findByCapability(intent);
    if (!candidates.length) return null;
    // Prefer higher tier (lower number) for core capabilities
    candidates.sort((a, b) => (a.tier ?? 1) - (b.tier ?? 1));
    return candidates[0];
  }

  findAllAgentsFor(intent) {
    return this.registry.findByCapability(intent);
  }

  routeTask(task) {
    const agent = this.findAgentFor(task.intent);
    if (!agent) {
      throw new Error(`No agent found for capability: ${task.intent}`);
    }
    return { agent, task };
  }
}

export { CapabilityRouter as CapabilityRouter };
