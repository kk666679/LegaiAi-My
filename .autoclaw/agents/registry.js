"use strict";
/**
 * agents/registry.js — Agent registry with capability routing.
 *
 * Agents register themselves at startup. The registry provides lookup by
 * ID, capability, and tier. Used by the orchestrator and capability router.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require('events');

class AgentRegistry extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.capabilities = new Map();
    this.tiers = new Map();
  }

  register(agent) {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent ${agent.id} already registered`);
    }
    this.agents.set(agent.id, agent);
    const tier = agent.tier ?? 1;
    const tierList = this.tiers.get(tier) ?? [];
    tierList.push(agent.id);
    this.tiers.set(tier, tierList);
    for (const cap of agent.capabilities) {
      const capList = this.capabilities.get(cap) ?? [];
      capList.push(agent.id);
      this.capabilities.set(cap, capList);
    }
    this.emit('registered', agent);
    return agent;
  }

  unregister(id) {
    const agent = this.agents.get(id);
    if (!agent) return false;
    this.agents.delete(id);
    for (const cap of agent.capabilities) {
      const list = this.capabilities.get(cap) ?? [];
      this.capabilities.set(cap, list.filter((a) => a !== id));
    }
    const tier = agent.tier ?? 1;
    const tierList = this.tiers.get(tier) ?? [];
    this.tiers.set(tier, tierList.filter((a) => a !== id));
    this.emit('unregistered', agent);
    return true;
  }

  get(id) {
    return this.agents.get(id);
  }

  findByCapability(capability) {
    return (this.capabilities.get(capability) ?? [])
      .map((id) => this.agents.get(id))
      .filter(Boolean);
  }

  findByTier(tier) {
    return (this.tiers.get(tier) ?? [])
      .map((id) => this.agents.get(id))
      .filter(Boolean);
  }

  list() {
    return [...this.agents.values()];
  }

  stats() {
    return {
      total: this.agents.size,
      byTier: Object.fromEntries(this.tiers),
      capabilities: this.capabilities.size,
    };
  }
}

exports.AgentRegistry = AgentRegistry;
exports.agentRegistry = new AgentRegistry();