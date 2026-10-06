import { agentRegistry } from './registry.js';

/**
 * agents/lifecycle.js — Agent lifecycle management: spawn → run → retire.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class AgentLifecycle {
  constructor({ registry = agentRegistry } = {}) {
    this.registry = registry;
  }

  async spawn(AgentClass, options) {
    const agent = new AgentClass(options);
    await agent.load();
    this.registry.register(agent);
    return agent;
  }

  async retire(agentId) {
    const agent = this.registry.get(agentId);
    if (agent) {
      await agent.onSessionEnd();
      this.registry.unregister(agentId);
    }
  }

  async restart(agentId, options) {
    await this.retire(agentId);
    return this.spawn(options.AgentClass, { ...options, ...options.extra });
  }

  getAgent(agentId) {
    return this.registry.get(agentId);
  }

  listAgents() {
    return this.registry.list();
  }
}

export { AgentLifecycle as AgentLifecycle };
