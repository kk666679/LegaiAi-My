export interface ScheduledJob {
  id: string; name: string; intervalMs: number;
  handler: () => Promise<void>;
  lastRunAt?: string; lastError?: string; runs: number; failures: number;
}
