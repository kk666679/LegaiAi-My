export interface AgentCard {
  agentId: string; name: string; version: string;
  endpoint?: string; capabilities: string[];
  healthy: boolean; registeredAt: string;
}
