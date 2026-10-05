'use strict';

/**
 * Policy guardrails for the dream cycle.
 *
 * Every ceiling is a safety rail, not a tuning knob: a consolidation pass that
 * rewrites more than `maxMergesPerCycle` nodes is destroying information rather
 * than tidying it, so `clamp` truncates silently instead of warning.
 */

const DEFAULT_POLICY = Object.freeze({
  dryRun: false,
  maxNodesPerCycle: 500,
  maxMergesPerCycle: 50,
  maxPrunesPerCycle: 200,
  maxEdgesAddedPerCycle: 300,
  maxReflectionsPerCycle: 20,
  pruneThreshold: 0.15,
  decayFactor: 0.95,
  salienceFloor: 0.2,
  enrichMinCoAccess: 2,
  reflectMinCommunity: 3
});

const CEILINGS = Object.freeze({
  nodes: 'maxNodesPerCycle',
  merges: 'maxMergesPerCycle',
  prunes: 'maxPrunesPerCycle',
  edgesAdded: 'maxEdgesAddedPerCycle',
  reflections: 'maxReflectionsPerCycle'
});

class Policy {
  constructor(overrides = {}) {
    this.config = { ...DEFAULT_POLICY, ...overrides };
  }

  get(k) { return this.config[k]; }

  isDryRun() { return !!this.config.dryRun; }

  /** Clamp `n` to the ceiling registered for `kind`. */
  clamp(kind, n) {
    const key = CEILINGS[kind];
    const lim = key ? this.config[key] : Infinity;
    return Math.max(0, Math.min(Number(n) || 0, lim));
  }
}

module.exports = { Policy, DEFAULT_POLICY, CEILINGS };
