"use strict";
/**
 * reputationPreference.ts — BL-7: wire reputation into the live dispatch path.
 *
 * The pieces existed but were never connected: `performance.ts`/`ledger.ts`
 * compute reputation, `RunnerRegistry.getPreferred` HAS a `reputation` criterion
 * that consults `opts.reputationByRunnerId`, and `dispatchViaRegistry` forwards
 * `preference` to it — but NO production caller ever built the reputation map and
 * passed it, so the §5.5 `reputation` step was always a no-op. "Reputation-aware
 * assignment" was advertised but inert.
 *
 * This module closes that gap with two reachable, testable seams:
 *   - `buildReputationPreference` — read the reputation ledger and shape it into
 *     `{ reputationByRunnerId }` (agent ids ARE runner ids).
 *   - `dispatchPreferredByReputation` — dispatch WITHOUT an explicit runner id so
 *     the preference order actually decides, with reputation fed in. This is the
 *     reputation-aware dispatch entry point the system was missing.
 *
 * No fs/vscode coupling beyond the ledger reader; unit-testable against a mock
 * registry + a seeded ledger.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildReputationPreference = buildReputationPreference;
exports.dispatchPreferredByReputation = dispatchPreferredByReputation;
const ledger_1 = require("../reputation/ledger");
const dispatchViaRegistry_1 = require("./dispatchViaRegistry");
/**
 * Read the reputation ledger under `workspaceRoot` and build a
 * `{ reputationByRunnerId }` preference fragment. Each agent maps to its bounded
 * reputation multiplier (`reputationFactor`, [0.5,1.0]); an agent with too few
 * samples gets the neutral prior so newcomers are never penalized. Returns `{}`
 * when the ledger is empty — a safe no-op that leaves the default order intact.
 */
async function buildReputationPreference(workspaceRoot, opts = {}) {
    const records = await (0, ledger_1.readTrackRecord)(workspaceRoot);
    if (records.length === 0) {
        return {};
    }
    const agg = (0, ledger_1.aggregateReputation)(records);
    const reputationByRunnerId = {};
    for (const [agentId, rep] of agg) {
        reputationByRunnerId[agentId] = (0, ledger_1.reputationFactor)(rep, undefined, opts.minSamples ?? 3);
    }
    return Object.keys(reputationByRunnerId).length > 0 ? { reputationByRunnerId } : {};
}
/**
 * Dispatch a unit of work to the registry's PREFERRED runner with reputation
 * folded into the §5.5 order — i.e. select by reputation (among workspace/cost/
 * latency), not an explicit id. This is the production caller that finally makes
 * `getPreferred`'s `reputation` criterion live. Returns `null` (no throw) when no
 * runner is selectable, mirroring `dispatchViaRegistry`.
 */
async function dispatchPreferredByReputation(registry, opts) {
    const { workspaceRoot, reputation, preference, ...rest } = opts;
    const repPref = await buildReputationPreference(workspaceRoot, reputation);
    return (0, dispatchViaRegistry_1.dispatchViaRegistry)(registry, {
        ...rest,
        // Intentionally NO runnerId — let the preference order (now reputation-aware) decide.
        preference: { ...(preference ?? {}), ...repPref },
    });
}
//# sourceMappingURL=reputationPreference.js.map