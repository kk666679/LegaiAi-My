export interface SkillInvocation {
  id: string; skillId: string; agentId: string;
  input: Record<string, unknown>; output?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string; completedAt?: string; error?: string;
}
