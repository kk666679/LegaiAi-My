import * as memory from './memory.js';
import { EventEmitter } from 'events';
import { KdreamPolicy } from './policies.js';
import { DreamJournal } from './buffer.js';
import { CycleMetrics } from './metrics.js';
import { detectPatterns, rankInsights } from './patterns.js';

/**
 * Dreamer — the memory consolidation cycle.
 *
 * Reads `learnings/insight-*.md`, promotes the insights the policy admits, and
 * regenerates `memory/MEMORY.md`.
 *
 * Modes are strictly nested, and `reflect` is always last so the rendered file
 * is the final state of the cycle, not an intermediate one:
 *   light → load + promote + reflect
 *   deep  → light + patterns
 *   full  → deep  + archive (trims the promoted set before rendering)
 *
 * A phase that throws is recorded and the cycle continues — a broken pattern
 * pass must not cost you the reflection that already ran. The only thing that
 * aborts a cycle is a concurrent cycle.
 *
 * This module touches no knowledge-graph edge. Graph consolidation lives in
 * `kgdream/`, which runs independently.
 */

const MODES = Object.freeze(['light', 'deep', 'full']);
const DAY_MS = 86400000;

class Dreamer extends EventEmitter {
  constructor({
    memoryPath,
    learningsDir,
    policy,
    journal,
    metrics,
    logger,
    stableFacts = [],
    openQuestions = []
  } = {}) {
    super();
    if (!memoryPath) throw new Error('Dreamer requires { memoryPath }');
    if (!learningsDir) throw new Error('Dreamer requires { learningsDir }');
    this.memoryPath = memoryPath;
    this.learningsDir = learningsDir;
    this.policy = policy instanceof KdreamPolicy ? policy : new KdreamPolicy(policy || {});
    this.journal = journal instanceof DreamJournal ? journal : new DreamJournal();
    this.metrics = metrics instanceof CycleMetrics ? metrics : new CycleMetrics();
    this.logger = logger || null;
    this.stableFacts = stableFacts;
    this.openQuestions = openQuestions;
    this._running = false;
    this._cycles = 0;
  }

  modes() { return [...MODES]; }

  _validateMode(mode) {
    if (!MODES.includes(mode)) {
      throw Object.assign(new Error(`Unknown mode: ${mode}`), { code: 'UNKNOWN_MODE', modes: this.modes() });
    }
  }

  /** Promotion gates: age, promoted flag, tag allow-list, tag deny-list, ceiling. */
  _admit(all) {
    const p = this.policy;
    const minAge = Number(p.get('minInsightAgeDays')) || 0;
    const cutoff = minAge > 0 ? Date.now() - minAge * DAY_MS : 0;
    const excluded = p.get('excludeTags') || [];
    const allowed = p.get('promoteTags') || [];

    let candidates = all;
    if (cutoff) candidates = candidates.filter(i => (i.mtime || 0) <= cutoff);
    if (p.get('requirePromotedFlag')) candidates = candidates.filter(i => i.front && i.front.promoted === true);
    if (allowed.length) {
      candidates = candidates.filter(i => Array.isArray(i.front.tags) && i.front.tags.some(t => allowed.includes(t)));
    }
    if (excluded.length) {
      candidates = candidates.filter(i => !(Array.isArray(i.front.tags) && i.front.tags.some(t => excluded.includes(t))));
    }
    return rankInsights(candidates).slice(0, p.clamp('promotions', candidates.length));
  }

  async runCycle({ mode = 'light', reason = 'manual' } = {}) {
    if (this._running) throw Object.assign(new Error('Dream cycle already running'), { code: 'BUSY' });
    this._validateMode(mode);
    this._running = true;
    const cycleId = this.metrics.startCycle();
    this._cycles++;
    const startedAt = Date.now();
    this.journal.write('cycle.start', { cycleId, mode, reason, dryRun: this.policy.isDryRun() });

    const phases = [];
    let insights = [];
    let promoted = [];
    let patterns = {};
    let ok = true;

    try {
      phases.push(await this._timed('load', () => {
        insights = memory.listInsights(this.learningsDir);
        return { ok: true, count: insights.length };
      }));

      phases.push(await this._timed('promote', () => {
        promoted = this._admit(insights);
        for (const i of promoted) this.journal.write('promote', { file: i.file, cycleId });
        return { ok: true, promoted: promoted.length, files: promoted.map(i => i.file) };
      }));

      if (mode === 'deep' || mode === 'full') {
        phases.push(await this._timed('patterns', () => {
          patterns = detectPatterns(insights, {
            minOccurrences: this.policy.get('patternMinOccurrences'),
            excludeTags: this.policy.get('excludeTags')
          });
          this.journal.write('patterns', { cycleId, count: Object.keys(patterns).length });
          return { ok: true, count: Object.keys(patterns).length };
        }));
      }

      if (mode === 'full') {
        phases.push(await this._timed('archive', () => {
          const cap = Number(this.policy.get('memoryMaxEntries'));
          const overflow = Number.isFinite(cap) ? Math.max(0, promoted.length - cap) : 0;
          const archived = this.policy.clamp('archives', overflow);
          promoted = promoted.slice(0, Math.max(0, promoted.length - archived));
          return { ok: true, archived, kept: promoted.length };
        }));
      }

      phases.push(await this._timed('reflect', () => {
        const content = memory.renderMemory({
          insights: promoted,
          patterns,
          stableFacts: this.stableFacts,
          openQuestions: this.openQuestions
        });
        const willWrite = !this.policy.isDryRun() && this.policy.get('writeMemoryFile');
        if (willWrite) memory.writeMemory(this.memoryPath, content);
        this.journal.write('reflect', { cycleId, bytes: content.length, written: willWrite });
        return { ok: true, bytes: content.length, written: willWrite, rendered: promoted.length };
      }));
    } finally {
      this._running = false;
    }

    ok = phases.every(p => p.ok);
    const report = {
      cycleId,
      mode,
      reason,
      dryRun: this.policy.isDryRun(),
      ok,
      startedAt,
      finishedAt: Date.now(),
      ms: Date.now() - startedAt,
      phases
    };
    this.journal.write('cycle.end', { cycleId, mode, ok, ms: report.ms });
    this.emit('cycle', report);
    if (this.logger && this.logger.info) {
      this.logger.info('kdream.cycle', { cycleId, mode, ok, ms: report.ms, dryRun: report.dryRun });
    }
    return report;
  }

  /** Phases may be sync or async; either way a throw is recorded, not thrown. */
  async _timed(name, fn) {
    const t0 = Date.now();
    try {
      const result = (await fn()) || {};
      const ms = Date.now() - t0;
      this.metrics.phase(name, ms, true);
      this.emit('phase', { name, ms, ok: true });
      return { name, ms, ok: true, ...result };
    } catch (err) {
      const ms = Date.now() - t0;
      this.metrics.phase(name, ms, false);
      this.emit('phase:error', { name, ms, error: err.message });
      return { name, ms, ok: false, error: err.message };
    }
  }

  isRunning() { return this._running; }
  cycleCount() { return this._cycles; }
  readMemory() { return memory.readMemory(this.memoryPath); }
  metricsSnapshot() { return this.metrics.snapshot(); }
}

;

export { Dreamer, MODES };
