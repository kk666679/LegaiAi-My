export interface DaemonStatus {
  running: boolean; startedAt?: string; ticks: number;
  lastTickAt?: string; lastError?: string;
}
