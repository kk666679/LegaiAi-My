import type { AgentDefinition } from './definition.js';
export class AgentRegistry {
  private agents = new Map<string, AgentDefinition>();
  register(a: AgentDefinition): void { this.agents.set(a.id, a); }
  get(id: string): AgentDefinition | undefined { return this.agents.get(id); }
  list(): AgentDefinition[] { return Array.from(this.agents.values()); }
  remove(id: string): boolean { return this.agents.delete(id); }
}
