/**
 * policies — the guardrails a dream cycle runs under.
 *
 * Every ceiling is a policy value, not a literal in a phase. `clamp()` is the
 * only way a phase turns a raw count into an acted-on count, so a ceiling
 * cannot be bypassed by forgetting to check it.
 */

const DEFAULT_POLICY = Object.freeze({
  dryRun: false,
  maxPromotionsPerCycle: 50,
  maxArchivesPerCycle: 100,
  minInsightAgeDays: 0,
  requirePromotedFlag: true,
  promoteTags: [],
  excludeTags: ['draft'],
  memoryMaxEntries: 500,
  patternMinOccurrences: 3,
  writeMemoryFile: true
});

class KdreamPolicy {
  constructor(overrides = {}) { this.config = { ...DEFAULT_POLICY, ...overrides }; }

  get(k) { return this.config[k]; }

  all() { return { ...this.config }; }

  isDryRun() { return !!this.config.dryRun; }

  /** Cap a count to the ceiling for that kind. Never negative. */
  clamp(kind, n) {
    const key = { promotions: 'maxPromotionsPerCycle', archives: 'maxArchivesPerCycle' }[kind];
    const lim = key ? Number(this.config[key]) : Infinity;
    if (!Number.isFinite(Number(n)) || Number(n) <= 0) return 0;
    return Math.max(0, Math.min(Math.floor(Number(n)), lim));
  }
}

;

export { KdreamPolicy, DEFAULT_POLICY };
