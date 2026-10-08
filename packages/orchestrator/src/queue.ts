import type { Task, TaskStatus } from './task.js';
export interface EnqueueOptions<TPayload> {
  kind: string; payload: TPayload; priority?: number; maxAttempts?: number;
}
export class TaskQueue {
  private tasks = new Map<string, Task>();
  private order: string[] = [];
  enqueue<P>(opts: EnqueueOptions<P>): Task<P> {
    const task: Task<P> = {
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      kind: opts.kind, payload: opts.payload, priority: opts.priority ?? 0,
      status: 'queued', createdAt: new Date().toISOString(),
      attempts: 0, maxAttempts: opts.maxAttempts ?? 1,
    };
    this.tasks.set(task.id, task as Task);
    this.order.push(task.id);
    this.sort();
    return task;
  }
  claim(worker: string, kind?: string): Task | undefined {
    for (const id of this.order) {
      const t = this.tasks.get(id);
      if (!t || t.status !== 'queued') continue;
      if (kind && t.kind !== kind) continue;
      t.status = 'running';
      t.assignedTo = worker;
      t.startedAt = new Date().toISOString();
      t.attempts++;
      return t;
    }
    return undefined;
  }
  complete(id: string, result?: unknown): void {
    const t = this.tasks.get(id);
    if (!t) return;
    t.status = 'completed'; t.result = result; t.completedAt = new Date().toISOString();
  }
  fail(id: string, error: string, retry = false): void {
    const t = this.tasks.get(id);
    if (!t) return;
    if (retry && t.attempts < t.maxAttempts) {
      t.status = 'queued'; t.assignedTo = undefined; t.startedAt = undefined; return;
    }
    t.status = 'failed'; t.error = error; t.completedAt = new Date().toISOString();
  }
  cancel(id: string): void {
    const t = this.tasks.get(id);
    if (t) { t.status = 'cancelled'; t.completedAt = new Date().toISOString(); }
  }
  get(id: string): Task | undefined { return this.tasks.get(id); }
  list(filter?: { status?: TaskStatus; kind?: string; assignedTo?: string }): Task[] {
    return Array.from(this.tasks.values()).filter((t) => {
      if (filter?.status && t.status !== filter.status) return false;
      if (filter?.kind && t.kind !== filter.kind) return false;
      if (filter?.assignedTo && t.assignedTo !== filter.assignedTo) return false;
      return true;
    });
  }
  stats(): Record<TaskStatus, number> {
    const out: Record<TaskStatus, number> = { queued: 0, running: 0, completed: 0, failed: 0, cancelled: 0 };
    for (const t of this.tasks.values()) out[t.status]++;
    return out;
  }
  private sort(): void { this.order.sort((a, b) => this.tasks.get(b)!.priority - this.tasks.get(a)!.priority); }
}
