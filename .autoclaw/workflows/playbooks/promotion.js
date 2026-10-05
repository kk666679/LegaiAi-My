"use strict";
/**
 * promotion.ts — Playbook Promotion Policy (AWL-3, adaptive-workflow-learning).
 *
 * AWL-2's experiment runner gates a SINGLE run's child persistence. This module
 * answers the longer-horizon question: given a playbook's OUTCOME HISTORY,
 * should it be promoted (preferred by the selector), held (keep gathering
 * evidence), or demoted (stop selecting it)?
 *
 * Deliberately conservative, per spec:
 *   - No decision at all below a minimum sample count — small-n win streaks
 *     are how reward hacking sneaks in.
 *   - Verifier confidence is a hard requirement, not a bonus.
 *   - Scope violations, false accepts, and Reward Guard findings are
 *     near-unforgivable: any in the window forces demotion.
 *   - Cost without quality is penalized: a playbook that spends more than its
 *     comparison baseline without out-rewarding it does not get promoted.
 *
 * Pure decisions over {@link ScaffoldScore} rows — no I/O, no clock. Every
 * decision carries concise audit reasons so a human (or the KG) can replay
 * why a playbook rose or fell.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeScores = summarizeScores;
exports.decidePromotion = decidePromotion;
exports.evaluatePromotions = evaluatePromotions;
const DEFAULTS = {
    minSamples: 5,
    minAvgReward: 0.6,
    minPassRate: 0.7,
    minVerifierPassRate: 0.8,
    demoteBelowReward: 0.2,
    window: 20,
    costTolerance: 1.5,
};
/** Roll score rows (any order) into the stats the policy judges. */
function summarizeScores(scaffoldId, scores, window) {
    const mine = scores
        .filter((s) => s.scaffoldId === scaffoldId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, Math.max(1, window));
    const n = mine.length;
    const count = (fn) => mine.filter(fn).length;
    return {
        samples: n,
        passRate: n === 0 ? 0 : count((s) => s.pass) / n,
        avgReward: n === 0 ? 0 : mine.reduce((sum, s) => sum + s.reward, 0) / n,
        verifierPassRate: n === 0 ? 0 : count((s) => s.verifierPass) / n,
        scopeViolations: count((s) => s.scopeViolation),
        falseAccepts: count((s) => s.falseAccept === true),
        guardViolations: count((s) => !!s.antiHackingViolation),
        avgCostCents: n === 0 ? 0 : mine.reduce((sum, s) => sum + (s.costCents ?? 0), 0) / n,
    };
}
function pct(x) {
    return `${Math.round(x * 100)}%`;
}
/**
 * Decide promote/hold/demote for one playbook from its score history.
 * `baseline` (usually the parent playbook's stats) enables the
 * cost-without-quality check; omit it and the check is skipped.
 */
function decidePromotion(scaffoldId, scores, opts = {}, baseline) {
    const cfg = { ...DEFAULTS, ...opts };
    const stats = summarizeScores(scaffoldId, scores, cfg.window);
    const reasons = [];
    // Hard integrity gates first — any hit is a demotion regardless of reward.
    if (stats.guardViolations > 0) {
        reasons.push(`${stats.guardViolations} reward-guard violation(s) in window`);
    }
    if (stats.scopeViolations > 0) {
        reasons.push(`${stats.scopeViolations} scope violation(s) in window`);
    }
    if (stats.falseAccepts > 0) {
        reasons.push(`${stats.falseAccepts} false accept(s) in window`);
    }
    if (reasons.length > 0) {
        return { scaffoldId, action: 'demote', reasons, stats };
    }
    // Not enough evidence → hold, always.
    if (stats.samples < cfg.minSamples) {
        return {
            scaffoldId,
            action: 'hold',
            reasons: [`insufficient samples (${stats.samples}/${cfg.minSamples})`],
            stats,
        };
    }
    // Sustained failure → demote.
    if (stats.avgReward < cfg.demoteBelowReward) {
        return {
            scaffoldId,
            action: 'demote',
            reasons: [`avg reward ${stats.avgReward.toFixed(2)} below demotion floor ${cfg.demoteBelowReward}`],
            stats,
        };
    }
    // Promotion requires EVERY quality bar, not a weighted blend.
    if (stats.avgReward < cfg.minAvgReward) {
        reasons.push(`avg reward ${stats.avgReward.toFixed(2)} < ${cfg.minAvgReward}`);
    }
    if (stats.passRate < cfg.minPassRate) {
        reasons.push(`pass rate ${pct(stats.passRate)} < ${pct(cfg.minPassRate)}`);
    }
    if (stats.verifierPassRate < cfg.minVerifierPassRate) {
        reasons.push(`verifier confidence ${pct(stats.verifierPassRate)} < ${pct(cfg.minVerifierPassRate)}`);
    }
    if (baseline && baseline.avgCostCents > 0) {
        const costly = stats.avgCostCents > baseline.avgCostCents * cfg.costTolerance;
        const better = stats.avgReward > baseline.avgReward;
        if (costly && !better) {
            reasons.push(`avg cost ${Math.round(stats.avgCostCents)}c exceeds baseline ${Math.round(baseline.avgCostCents)}c ×${cfg.costTolerance} without reward gain`);
        }
    }
    if (reasons.length > 0) {
        return { scaffoldId, action: 'hold', reasons, stats };
    }
    return {
        scaffoldId,
        action: 'promote',
        reasons: [
            `reward ${stats.avgReward.toFixed(2)}, pass ${pct(stats.passRate)}, verifier ${pct(stats.verifierPassRate)} over ${stats.samples} runs`,
        ],
        stats,
    };
}
/** Decide for every playbook present in `scores`, deterministic order by id. */
function evaluatePromotions(scores, opts = {}, baselines = {}) {
    const ids = [...new Set(scores.map((s) => s.scaffoldId))].sort();
    return ids.map((id) => decidePromotion(id, scores, opts, baselines[id]));
}
//# sourceMappingURL=promotion.js.map