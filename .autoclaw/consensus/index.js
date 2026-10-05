'use strict';

/**
 * consensus — aggregate votes from independent validators into one outcome.
 *
 * A voter is an async function receiving the proposal and returning
 * `{ vote, confidence?, rationale? }`. A voter that throws is NOT dropped: it
 * casts an explicit `abstain` with an `error:` rationale, so a flaky validator
 * can never be mistaken for a silent approval.
 */

const OUTCOME = Object.freeze({
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  ABSTAINED: 'abstained'
});

const VOTE = Object.freeze({ YES: 'yes', NO: 'no', ABSTAIN: 'abstain' });

class ConsensusError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ConsensusError';
    this.code = code;
  }
}

class UnknownStrategyError extends ConsensusError {
  constructor(s) { super(`Unknown strategy: ${s}`, 'UNKNOWN_STRATEGY'); this.name = 'UnknownStrategyError'; this.strategy = s; }
}

class NoVotersError extends ConsensusError {
  constructor() { super('No voters registered', 'NO_VOTERS'); this.name = 'NoVotersError'; }
}

/**
 * Strategy contract: `(tally, opts) => boolean` — true means accepted.
 * `tally` carries raw counts plus the derived `share` of non-abstain votes.
 */
const STRATEGIES = Object.freeze({
  // Share of non-abstain votes that are yes, at or above `threshold`.
  threshold: (t, o) => t.nonAbstain > 0 && t.share >= num(o.threshold, 0.5),

  // Strictly more yes than no.
  majority: t => t.yes > t.no,

  // Share of non-abstain votes at or above `ratio`, and no more than
  // `maxNoRatio` share of no. A bare ratio would let 1-of-4 yes pass a 0.25
  // bar, so the no-share ceiling is enforced independently.
  supermajority: (t, o) => {
    if (t.nonAbstain === 0) return false;
    const ratio = num(o.ratio, 0.75);
    const maxNoRatio = num(o.maxNoRatio, 1 - ratio);
    return t.share >= ratio && (t.no / t.nonAbstain) <= maxNoRatio;
  },

  // Every non-abstain voter says yes.
  unanimous: t => t.nonAbstain > 0 && t.no === 0,

  // Confidence-weighted share of yes.
  weighted: (t, o) => {
    const total = t.yesW + t.noW;
    if (total <= 0) return false;
    const threshold = num(o.threshold, 0.5);
    return (t.yesW / total) >= threshold;
  }
});

function num(v, dflt) {
  const n = Number(v);
  return Number.isFinite(n) ? n : dflt;
}

/* ── Test voter factories ─────────────────────────────────────────────── */

const alwaysYes = (confidence = 1, rationale = '') => async () => ({ vote: VOTE.YES, confidence, rationale });
const alwaysNo = (confidence = 1, rationale = '') => async () => ({ vote: VOTE.NO, confidence, rationale });
const alwaysAbstain = (rationale = '') => async () => ({ vote: VOTE.ABSTAIN, confidence: 0, rationale });

class Consensus {
  constructor({ strategy = 'threshold', strategyOpts = {} } = {}) {
    if (!Object.prototype.hasOwnProperty.call(STRATEGIES, strategy)) {
      throw new UnknownStrategyError(strategy);
    }
    this.strategy = strategy;
    this.strategyOpts = strategyOpts || {};
    this.voters = new Map();
  }

  registerVoter(id, fn) {
    if (typeof fn !== 'function') throw new TypeError(`Voter "${id}" must be a function`);
    this.voters.set(id, fn);
    return this;
  }

  unregisterVoter(id) { return this.voters.delete(id); }

  /**
   * Collect ballots and apply the strategy. Rejects with NoVotersError when
   * nothing is registered — an empty vote must not read as consent.
   */
  async vote(proposal = {}) {
    if (this.voters.size === 0) throw new NoVotersError();

    const ballots = [];
    for (const [id, fn] of this.voters) {
      try {
        const raw = await fn(proposal);
        const vote = raw && typeof raw === 'object' ? raw.vote : raw;
        const confidence = raw && typeof raw === 'object' ? num(raw.confidence, 0) : 0;
        const rationale = (raw && typeof raw === 'object' && raw.rationale) || '';
        if (vote !== VOTE.YES && vote !== VOTE.NO && vote !== VOTE.ABSTAIN) {
          ballots.push({ id, vote: VOTE.ABSTAIN, confidence: 0, rationale: `error: invalid vote "${vote}"` });
          continue;
        }
        ballots.push({ id, vote, confidence, rationale });
      } catch (err) {
        // A throwing validator abstains explicitly rather than disappearing.
        ballots.push({
          id,
          vote: VOTE.ABSTAIN,
          confidence: 0,
          rationale: `error: ${err && err.message ? err.message : String(err)}`
        });
      }
    }

    const tally = tallyBallots(ballots, this.strategyOpts.weights);
    const fn = STRATEGIES[this.strategy];
    const accepted = fn(tally, this.strategyOpts);

    let outcome;
    if (tally.nonAbstain === 0) outcome = OUTCOME.ABSTAINED;
    else outcome = accepted ? OUTCOME.ACCEPTED : OUTCOME.REJECTED;

    return {
      outcome,
      accepted: outcome === OUTCOME.ACCEPTED,
      strategy: this.strategy,
      strategyOpts: this.strategyOpts,
      tally: { yes: tally.yes, no: tally.no, abstain: tally.abstain },
      avgConfidence: tally.avgConfidence,
      ballots,
      extra: {
        nonAbstain: tally.nonAbstain,
        share: tally.share,
        yesW: tally.yesW,
        noW: tally.noW,
        totalVotes: tally.total
      }
    };
  }
}

function tallyBallots(ballots, weights) {
  const w = weights || {};
  let yes = 0, no = 0, abstain = 0, yesW = 0, noW = 0, confSum = 0, counted = 0;
  for (const b of ballots) {
    // A voter weight scales its confidence. Unlisted voters carry weight 1.
    const weight = num(w[b.id], 1);
    if (b.vote === VOTE.YES) { yes++; yesW += b.confidence * weight; }
    else if (b.vote === VOTE.NO) { no++; noW += b.confidence * weight; }
    else { abstain++; continue; }
    confSum += b.confidence;
    counted++;
  }
  const nonAbstain = yes + no;
  return {
    yes, no, abstain,
    nonAbstain,
    total: ballots.length,
    yesW, noW,
    share: nonAbstain ? yes / nonAbstain : 0,
    avgConfidence: counted ? confSum / counted : 0
  };
}

/** Names of the registered strategies, with the options each one reads. */
function listStrategies() {
  return Object.keys(STRATEGIES).map(name => ({ name }));
}

module.exports = {
  Consensus,
  ConsensusError,
  UnknownStrategyError,
  NoVotersError,
  STRATEGIES,
  OUTCOME,
  VOTE,
  alwaysYes,
  alwaysNo,
  alwaysAbstain,
  tallyBallots,
  listStrategies
};