"use strict";
/**
 * router.ts — AF-9: capability-aware, score-based task router.
 *
 * `routing.ts` (AF-3) ranks agents by a Jaccard overlap of capability/type
 * tags. That answers "who is the best *kind* of agent" but not "who should
 * take THIS task right now given trust, language, current load, and cost".
 *
 * This module implements the score formula the orchestrate skill promises
 * (skills/orchestrate + DESIGN.md §3 Gap C):
 *
 *   score(agent, task) =
 *       capability_match     // coverage of required caps by effective tags
 *     × language_match       // task language supported?
 *     × trust_score          // trust level, GATED for criticality-1
 *     × idle_factor          // 1 - load/capacity (0 ⇒ busy ⇒ ineligible)
 *     × cost_factor          // cheaper agents score higher
 *     × phase_factor         // plan/review favour trust; grade favours cost
 *
 * The highest eligible score wins. When no agent is eligible the caller is
 * told to fall back to round-robin and a warning is recorded in `notes`
 * (matching the skill's documented contract).
 *
 * Pure + `vscode`-free so it unit-tests in plain Mocha. It deliberately layers
 * ON TOP of `routing.ts` (it reuses the agent-type tag expansion) rather than
 * replacing it — `rankAgentsForCapabilities` stays the answer for type-only
 * routing (e.g. reviewer selection).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.capabilityMatch = capabilityMatch;
exports.languageMatch = languageMatch;
exports.trustScore = trustScore;
exports.idleFactor = idleFactor;
exports.costFactor = costFactor;
exports.phaseFactor = phaseFactor;
exports.scoreAgent = scoreAgent;
exports.routeTask = routeTask;
exports.routeTasks = routeTasks;
exports.agentsFromOffers = agentsFromOffers;
const agentTypes_1 = require("./agentTypes");
/* -------------------------------------------------------------------------- */
/*  Scoring primitives                                                        */
/* -------------------------------------------------------------------------- */
/** Trust level → numeric weight (0..1). */
const TRUST_WEIGHT = {
    untrusted: 0,
    low: 0.4,
    medium: 0.7,
    high: 1,
};
/** Effective capability tags = declared capabilities ∪ agent-type tags. */
function effectiveTags(agent) {
    const type = agent.agent_type ?? 'coder';
    return new Set([...(agent.capabilities ?? []), ...(0, agentTypes_1.agentTypeProfile)(type).capabilityTags]);
}
/**
 * Coverage of the task's required capabilities by the agent's effective tags.
 * No requirements ⇒ 1 (any agent qualifies). Otherwise the fraction of
 * required tags the agent covers — so a partial match still scores, but a full
 * match always beats it.
 */
function capabilityMatch(agent, required = []) {
    if (required.length === 0) {
        return 1;
    }
    const tags = effectiveTags(agent);
    const covered = required.filter(c => tags.has(c)).length;
    return covered / required.length;
}
/**
 * Language fit. No language required ⇒ 1. Supported ⇒ 1. Unsupported but the
 * agent declared *some* languages ⇒ 0.25 (penalised, not eliminated — an agent
 * may still cope). Agent declared no languages ⇒ 0.6 (unknown, mild penalty).
 */
function languageMatch(agent, language) {
    if (!language) {
        return 1;
    }
    const langs = agent.languages_supported;
    if (!langs || langs.length === 0) {
        return 0.6;
    }
    return langs.includes(language) ? 1 : 0.25;
}
/** Trust weight (0..1). Defaults to `low` when the agent declares none. */
function trustScore(agent) {
    return TRUST_WEIGHT[agent.trust_level ?? 'low'];
}
/**
 * Idle factor: 1 - load/capacity, clamped to [0,1]. At/over capacity ⇒ 0 ⇒
 * the agent is busy and therefore ineligible.
 */
function idleFactor(agent) {
    const capacity = Math.max(1, agent.max_parallel_tasks ?? 1);
    const load = Math.max(0, agent.current_load ?? 0);
    return Math.max(0, Math.min(1, 1 - load / capacity));
}
/** Cost factor: cheaper is higher. `1/(1+cost)`; unknown cost ⇒ neutral 1. */
function costFactor(agent) {
    const cost = agent.estimated_cost_usd;
    if (cost === undefined || cost <= 0) {
        return 1;
    }
    return 1 / (1 + cost);
}
/**
 * Phase factor. `plan`/`review` lean on trust (a strong agent), `grade` leans
 * on cost (a cheap agent), `execute`/absent are neutral. Returns a multiplier
 * derived from the already-computed trust and cost factors so the phase only
 * *re-weights* — it never introduces a new dimension.
 */
function phaseFactor(phase, trust, cost) {
    switch (phase) {
        case 'plan':
        case 'review':
            return 0.5 + 0.5 * trust; // up to 1 for high trust, 0.5 floor
        case 'grade':
            return 0.5 + 0.5 * cost; // favour cheap agents
        default:
            return 1; // execute / unspecified
    }
}
/* -------------------------------------------------------------------------- */
/*  Eligibility gate + composite score                                        */
/* -------------------------------------------------------------------------- */
/**
 * Score one agent against one task. An ineligible agent returns `score: 0`
 * with `eligible: false` and a `reason`. Eligibility rules:
 *   - must be available (a capability_offer may set `available: false`),
 *   - must cover at least one required capability (capability_match > 0),
 *   - must have spare capacity (idle_factor > 0),
 *   - criticality-1 tasks require trust ≥ medium (DESIGN.md Gap C trust gate),
 *   - trust weight must be > 0 (untrusted agents never auto-take work).
 */
function scoreAgent(agent, task) {
    const capability_match = capabilityMatch(agent, task.required_capabilities);
    const language_match = languageMatch(agent, task.language);
    const trust_score = trustScore(agent);
    const idle_factor = idleFactor(agent);
    const cost_factor = costFactor(agent);
    const phase_factor = phaseFactor(task.phase, trust_score, cost_factor);
    const ineligible = (reason) => ({
        agent_id: agent.id, score: 0,
        capability_match, language_match, trust_score, idle_factor, cost_factor, phase_factor,
        eligible: false, reason,
    });
    if (agent.available === false) {
        return ineligible('unavailable (capability_offer.available=false)');
    }
    if (capability_match === 0) {
        return ineligible('no required capability covered');
    }
    if (idle_factor === 0) {
        return ineligible('at or over capacity');
    }
    if (trust_score === 0) {
        return ineligible('untrusted agent');
    }
    if (task.criticality === 1 && (agent.trust_level ?? 'low') !== 'high' && (agent.trust_level ?? 'low') !== 'medium') {
        return ineligible('criticality-1 task requires trust >= medium');
    }
    const score = capability_match * language_match * trust_score * idle_factor * cost_factor * phase_factor;
    return {
        agent_id: agent.id, score,
        capability_match, language_match, trust_score, idle_factor, cost_factor, phase_factor,
        eligible: true,
        reason: 'eligible',
    };
}
/**
 * Route a single task to the best-scoring eligible agent.
 *
 * When no agent is eligible, `chosen` is undefined and `fallback` is true with
 * a `notes` warning — the caller should then round-robin (the orchestrate
 * skill's documented behaviour). Stable: equal scores keep input order.
 */
function routeTask(agents, task) {
    const scores = agents
        .map(a => scoreAgent(a, task))
        .sort((a, b) => b.score - a.score);
    const best = scores.find(s => s.eligible && s.score > 0);
    const notes = [];
    if (!best) {
        notes.push(`no eligible agent for task "${task.id}" ` +
            `(required=[${(task.required_capabilities ?? []).join(',')}], ` +
            `criticality=${task.criticality ?? 2}); fall back to round-robin`);
        return { task_id: task.id, scores, fallback: true, notes };
    }
    return { task_id: task.id, chosen: best.agent_id, scores, fallback: false, notes };
}
/**
 * Route many tasks, assigning each to its best agent while respecting
 * capacity: once an agent is chosen its `current_load` is incremented for
 * subsequent tasks in the same pass, so a single strong agent does not absorb
 * every task. Returns one {@link RouteResult} per task, in input order.
 */
function routeTasks(agents, tasks) {
    // Work on a mutable copy of loads so we can reflect in-pass assignments.
    const liveLoad = new Map(agents.map(a => [a.id, Math.max(0, a.current_load ?? 0)]));
    const results = [];
    for (const task of tasks) {
        const snapshot = agents.map(a => ({ ...a, current_load: liveLoad.get(a.id) ?? 0 }));
        const result = routeTask(snapshot, task);
        if (result.chosen) {
            liveLoad.set(result.chosen, (liveLoad.get(result.chosen) ?? 0) + 1);
        }
        results.push(result);
    }
    return results;
}
/**
 * Build {@link SchedulableAgent}s from live `capability_offer` payloads. Offers
 * without an `agent_id` are skipped. The newest offer per agent wins when
 * `offers` is already ordered oldest→newest (the caller passes them in arrival
 * order; later entries overwrite earlier ones).
 */
function agentsFromOffers(offers) {
    const byId = new Map();
    for (const o of offers) {
        if (!o.agent_id) {
            continue;
        }
        byId.set(o.agent_id, {
            id: o.agent_id,
            agent_type: o.agent_type,
            capabilities: o.capabilities,
            languages_supported: o.languages_supported,
            trust_level: o.trust_level,
            max_parallel_tasks: o.max_parallel_tasks,
            current_load: o.current_load,
            estimated_cost_usd: o.estimated_cost_usd,
            available: o.available,
        });
    }
    return [...byId.values()];
}
//# sourceMappingURL=router.js.map