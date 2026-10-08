import { EventEmitter } from 'events';

/**
 * tasks — in-process async job runner with a concurrency ceiling.
 *
 * Not a durable queue. Anything that must survive a crash belongs in the
 * BullMQ workers (`src/workers/`) or the spine (`spine/spine.db`).
 */

const STATUS = Object.freeze({
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
});

class UnknownTaskKindError extends Error {
  constructor(kind) { super(`Unknown task kind: ${kind}`); this.name = 'UnknownTaskKindError'; this.code = 'UNKNOWN_TASK_KIND'; this.kind = kind; }
}

let jobSeq = 0;

class TaskRunner extends EventEmitter {
  constructor({ concurrency = 2, clock = () => new Date().toISOString() } = {}) {
    super();
    this.concurrency = Math.max(1, Number(concurrency) || 1);
    this.clock = clock;
    this.handlers = new Map();
    this.jobs = new Map();
    this.running = 0;
    this._pumping = false;
  }

  register(kind, fn) {
    if (typeof fn !== 'function') throw new TypeError(`Handler for "${kind}" must be a function`);
    this.handlers.set(kind, fn);
    return this;
  }

  /** Enqueue. Throws synchronously on an unregistered kind — fail fast. */
  enqueue(kind, payload = {}, { priority = 0 } = {}) {
    if (!this.handlers.has(kind)) throw new UnknownTaskKindError(kind);
    const job = {
      id: `job_${(++jobSeq).toString(36)}`,
      kind,
      payload,
      priority: Number(priority) || 0,
      status: STATUS.QUEUED,
      result: null,
      error: null,
      enqueuedAt: this.clock(),
      startedAt: null,
      finishedAt: null
    };
    this.jobs.set(job.id, job);
    this.emit('enqueued', job);
    // Fire-and-forget: progress is observed via events and get().
    this._pump();
    return job;
  }

  get(id) { return this.jobs.get(id) || null; }

  /** All jobs, optionally filtered to one status. Returns a flat array. */
  listByStatus(status) {
    const all = [...this.jobs.values()];
    return status ? all.filter(j => j.status === status) : all;
  }

  /**
   * Jobs bucketed by status. This is the shape dashboards and the MCP
   * `task_list` tool consume, so it is the default no-arg form of `list()`.
   */
  list() {
    const grouped = {
      running: [],
      queued: [],
      completed: [],
      failed: [],
      cancelled: []
    };
    for (const j of this.jobs.values()) {
      (grouped[j.status] || (grouped[j.status] = [])).push(j);
    }
    return grouped;
  }

  cancel(id) {
    const job = this.jobs.get(id);
    if (!job) return false;
    if (job.status !== STATUS.QUEUED) return false;
    job.status = STATUS.CANCELLED;
    job.finishedAt = this.clock();
    this.emit('cancelled', job);
    return true;
  }

  /** Drain the queue, never exceeding `concurrency`. */
  _pump() {
    if (this._pumping) return;
    this._pumping = true;
    try {
      while (this.running < this.concurrency) {
        const next = this.listByStatus(STATUS.QUEUED)
          .sort((a, b) => b.priority - a.priority)[0];
        if (!next) break;
        this.running++;
        this._run(next).finally(() => {
          this.running--;
          this._pump();
        });
      }
    } finally {
      this._pumping = false;
    }
  }

  async _run(job) {
    job.status = STATUS.RUNNING;
    job.startedAt = this.clock();
    this.emit('started', job);
    try {
      const fn = this.handlers.get(job.kind);
      job.result = await fn(job.payload, job);
      job.status = STATUS.COMPLETED;
      job.finishedAt = this.clock();
      this.emit('completed', job);
    } catch (err) {
      job.error = err;
      job.status = STATUS.FAILED;
      job.finishedAt = this.clock();
      this.emit('failed', job);
    }
  }

  /** Resolve once no job is queued or running. */
  async drain() {
    while (this.listByStatus(STATUS.QUEUED).length || this.running > 0) {
      await new Promise(r => setTimeout(r, 1));
    }
  }
}

/**
 * Built-in handlers. Each is a stub that reports what a real implementation
 * would need — wiring them to `src/workers/` is a deployment decision, not a
 * module concern.
 */
function defaultHandlers({ logger = null, spine = null, dataset = null } = {}) {
  const note = (name) => ({ handler: name, ok: false, reason: 'not-wired', at: new Date().toISOString() });

  return {
    'lom.ingest': async (payload = {}) => {
      if (logger) logger.info('tasks.lom.ingest', payload);
      return note('lom.ingest');
    },
    'corpus.reindex': async (payload = {}) => {
      if (logger) logger.info('tasks.corpus.reindex', payload);
      return note('corpus.reindex');
    },
    'eval.run': async (payload = {}) => {
      if (dataset && typeof dataset.loadAll === 'function') {
        const r = dataset.validate();
        return { handler: 'eval.run', ok: r.ok, counts: r.counts };
      }
      return note('eval.run');
    },
    'spine.record': async (payload = {}) => {
      if (spine && typeof spine.appendJsonl === 'function') {
        spine.appendJsonl('orchestrator/comms/comms-log.jsonl', payload);
        return { handler: 'spine.record', ok: true };
      }
      return note('spine.record');
    }
  };
}

;

export { TaskRunner, UnknownTaskKindError, defaultHandlers, STATUS };
