import type { AgentCard } from './card.js';
export class Fabric {
  private cards = new Map<string, AgentCard>();
  register(card: Omit<AgentCard, 'registeredAt'> & { registeredAt?: string }): AgentCard {
    const full: AgentCard = { ...card, registeredAt: card.registeredAt ?? new Date().toISOString() };
    this.cards.set(full.agentId, full);
    return full;
  }
  get(agentId: string): AgentCard | undefined { return this.cards.get(agentId); }
  list(): AgentCard[] { return Array.from(this.cards.values()); }
  remove(agentId: string): boolean { return this.cards.delete(agentId); }
  findByCapability(capability: string): AgentCard[] {
    return this.list().filter((c) => c.healthy && c.capabilities.includes(capability));
  }
  markHealth(agentId: string, healthy: boolean): void {
    const c = this.cards.get(agentId);
    if (c) c.healthy = healthy;
  }
  availableCapabilities(): string[] {
    const set = new Set<string>();
    for (const c of this.list()) if (c.healthy) for (const cap of c.capabilities) set.add(cap);
    return Array.from(set);
  }
}
