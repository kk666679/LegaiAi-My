/** CycleMetrics — per-phase runs, total ms, ok/failed counts, plus free counters. */
class CycleMetrics {
  constructor() { this.cycles = 0; this.phases = new Map(); this.counters = new Map(); }

  startCycle() { return ++this.cycles; }

  inc(k, by = 1) { this.counters.set(k, (this.counters.get(k) || 0) + by); }

  phase(name, ms, ok) {
    const t = this.phases.get(name) || { runs: 0, ms: 0, ok: 0, failed: 0 };
    t.runs++;
    t.ms += Number(ms) || 0;
    if (ok) t.ok++; else t.failed++;
    this.phases.set(name, t);
  }

  snapshot() {
    const phases = {};
    for (const [k, v] of this.phases) phases[k] = { ...v, avgMs: v.runs ? v.ms / v.runs : 0 };
    return { cycles: this.cycles, counters: Object.fromEntries(this.counters), phases };
  }

  reset() { this.cycles = 0; this.phases.clear(); this.counters.clear(); }
}

;

export { CycleMetrics };
