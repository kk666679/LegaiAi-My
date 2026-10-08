import type { DaemonStatus } from './status.js';
export interface DaemonOptions {
  tickMs?: number;
  onTick: () => Promise<void> | void;
  onError?: (err: Error) => void;
}
export class Daemon {
  private timer?: NodeJS.Timeout;
  private status: DaemonStatus = { running: false, ticks: 0 };
  constructor(private readonly opts: DaemonOptions) {}
  start(): void {
    if (this.status.running) return;
    this.status = { running: true, startedAt: new Date().toISOString(), ticks: 0 };
    this.timer = setInterval(() => this.tick(), this.opts.tickMs ?? 5_000);
  }
  stop(): void { if (this.timer) clearInterval(this.timer); this.timer = undefined; this.status.running = false; }
  private async tick(): Promise<void> {
    try {
      await this.opts.onTick();
      this.status.ticks++;
      this.status.lastTickAt = new Date().toISOString();
    } catch (e) {
      this.status.lastError = (e as Error).message;
      this.opts.onError?.(e as Error);
    }
  }
  getStatus(): DaemonStatus { return { ...this.status }; }
}
