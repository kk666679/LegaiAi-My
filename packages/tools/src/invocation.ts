export interface ToolInvocation {
  id: string; toolId: string; input: unknown; output?: unknown;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  startedAt: string; completedAt?: string; durationMs?: number; error?: string;
}
