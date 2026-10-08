import type { ScheduledJob } from './job.js';
export class Scheduler {
  private jobs = new Map<string, ScheduledJob>();
  private timers = new Map<string, NodeJS.Timeout>();
  private running = false;
  register(job: ScheduledJob): void { this.jobs.set(job.id, job); if (this.running) this.schedule(job); }
  start(): void { if (this.running) return; this.running = true; for (const j of this.jobs.values()) this.schedule(j); }
  stop(): void { this.running = false; for (const t of this.timers.values()) clearInterval(t); this.timers.clear(); }
  private schedule(job: ScheduledJob): void {
    const t = setInterval(async () => {
      try { await job.handler(); job.runs++; job.lastRunAt = new Date().toISOString(); }
      catch (e) { job.failures++; job.lastError = (e as Error).message; }
    }, job.intervalMs);
    this.timers.set(job.id, t);
  }
  snapshot(): Array<Pick<ScheduledJob, 'id' | 'name' | 'runs' | 'failures' | 'lastRunAt' | 'lastError'>> {
    return Array.from(this.jobs.values()).map((j) => ({ id: j.id, name: j.name, runs: j.runs, failures: j.failures, lastRunAt: j.lastRunAt, lastError: j.lastError }));
  }
}
