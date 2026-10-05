'use strict';

const { EventEmitter } = require('events');
const { Policy } = require('./policies');
const replayPhase = require('./phases/replay');
const consolidatePhase = require('./phases/consolidate');
const prunePhase = require('./phases/prune');
const enrichPhase = require('./phases/enrich');
const reflectPhase = require('./phases/reflect');

/**
 * Dreamer — runs one consolidation cycle and reports per-phase results.
 *
 * A phase that throws is recorded and the cycle continues: a broken enrich pass
 * must not cost you the prune pass that already ran. The only thing that
 * aborts a cycle is a concurrent cycle (the `_running` guard).
 */
class Dreamer extends EventEmitter {
  constructor({ store, policy, logger } = {}) {
    super();
    this.store = store || null;
    this.policy = policy instanceof Policy ? policy : new Policy(policy || {});
    this.logger = logger || null;
    this._running = false;
    this._cycles = 0;
  }

  _phasesFor(mode) {
    switch (mode) {
      case 'light':   return [replayPhase.replay, prunePhase.prune];
      case 'deep':    return [replayPhase.replay, consolidatePhase.consolidate, prunePhase.prune, enrichPhase.enrich];
      case 'rem':     return [replayPhase.replay, enrichPhase.enrich, reflectPhase.reflect];
      case 'focused': return [replayPhase.replay, reflectPhase.reflect];
      default:        return [replayPhase.replay];
    }
  }

  async runCycle({ mode = 'light', input = {}, reason = 'manual' } = {}) {
    if (this._running) {
      throw Object.assign(new Error('Dream cycle already running'), { code: 'BUSY' });
    }
    this._running = true;
    const cycleId = ++this._cycles;
    const startedAt = Date.now();
    const phases = [];
    let dreamSet = [];
    let ok = true;

    try {
      for (const fn of this._phasesFor(mode)) {
        try {
          const r = await fn({ store: this.store, policy: this.policy, dreamSet, input });
          phases.push(r);
          if (r.dreamSet) dreamSet = r.dreamSet;
          this.emit('phase', { cycleId, name: r.name, ok: r.ok });
        } catch (err) {
          ok = false;
          phases.push({ name: fn.name || 'phase', ok: false, notes: [err.message] });
          this.emit('phase:error', { cycleId, name: fn.name, error: err.message });
        }
      }
    } finally {
      this._running = false;
    }

    const report = {
      cycleId,
      mode,
      reason,
      dryRun: this.policy.isDryRun(),
      ok,
      startedAt,
      finishedAt: Date.now(),
      ms: Date.now() - startedAt,
      dreamSetSize: dreamSet.length,
      phases
    };

    this.emit('cycle', report);
    if (this.logger && this.logger.info) {
      this.logger.info('kgdream.cycle', { cycleId, mode, ok, ms: report.ms });
    }
    return report;
  }

  isRunning() { return this._running; }
  cycleCount() { return this._cycles; }
}

module.exports = { Dreamer };
