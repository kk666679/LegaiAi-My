export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export interface Task<TPayload = unknown> {
  id: string; kind: string; payload: TPayload; priority: number;
  status: TaskStatus; assignedTo?: string;
  createdAt: string; startedAt?: string; completedAt?: string;
  attempts: number; maxAttempts: number; result?: unknown; error?: string;
}
