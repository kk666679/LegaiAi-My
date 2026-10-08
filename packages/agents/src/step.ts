export interface AgentStep {
  index: number; thought?: string; action?: { toolId: string; input: unknown };
  observation?: unknown; answer?: string; startedAt: string;
  completedAt?: string; error?: string;
}
