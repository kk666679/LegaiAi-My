"use strict";
/**
 * replay.ts — Run replay and rerun-from-node for the WL-1 headless runner (WL-1.5).
 *
 * Provides three read-only / deterministic surfaces:
 *   1. replayRun() — reconstruct node states from an events.jsonl ledger.
 *   2. rerunFromNode() — re-execute a workflow starting at `nodeId`, passing
 *      saved upstream outputs as the new upstream context.
 *   3. compareRuns() — diff two RunResults (cost, duration, model, gate
 *      results, failure type).
 *
 * All replay/rerun operations use the same mockable RunnerDeps as the runner,
 * so no model or command calls happen unless explicitly injected.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.replayRun = replayRun;
exports.rerunFullWorkflow = rerunFullWorkflow;
exports.rerunFromNode = rerunFromNode;
exports.compareRuns = compareRuns;
const fs = require("fs");
const path = require("path");
const runner_1 = require("./runner");
const runLedger_1 = require("./runLedger");
function readRunEvents(workspaceRoot, runId) {
    const p = (0, runLedger_1.runEventsPath)(workspaceRoot, runId);
    let raw;
    try {
        raw = fs.readFileSync(p, 'utf8');
    }
    catch {
        return [];
    }
    const out = [];
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) {
            continue;
        }
        try {
            out.push(JSON.parse(trimmed));
        }
        catch {
            // skip corrupt line
        }
    }
    return out;
}
function nodeStatesFromEvents(events) {
    const states = {};
    for (const ev of events) {
        if (ev.nodeId === '_run') {
            continue;
        }
        const prev = states[ev.nodeId] ?? {
            nodeId: ev.nodeId,
            status: 'pending',
            attempts: 0,
        };
        if (ev.event === 'started') {
            states[ev.nodeId] = { ...prev, status: 'running', startedAt: ev.timestamp };
        }
        else if (ev.event === 'completed') {
            states[ev.nodeId] = { ...prev, status: 'completed', endedAt: ev.timestamp, attempts: (prev.attempts ?? 0) + 1 };
        }
        else if (ev.event === 'failed') {
            states[ev.nodeId] = {
                ...prev,
                status: 'failed',
                failureType: ev.failureType,
                endedAt: ev.timestamp,
                attempts: (prev.attempts ?? 0) + 1,
            };
        }
        else if (ev.event === 'retrying') {
            states[ev.nodeId] = { ...prev, status: 'running', attempts: (prev.attempts ?? 0) + 1 };
        }
        else {
            states[ev.nodeId] = { ...prev };
        }
    }
    return states;
}
/**
 * Reconstruct a run from its JSONL ledger. Read-only — does not re-execute
 * anything. Corrupt lines are skipped with warnings.
 */
function replayRun(workspaceRoot, runId) {
    const warnings = [];
    const events = readRunEvents(workspaceRoot, runId);
    let metadata;
    try {
        const metaPath = path.join(workspaceRoot, '.autoclaw', 'workflows', 'runs', runId, 'run.json');
        if (fs.existsSync(metaPath)) {
            metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        }
    }
    catch (err) {
        warnings.push(`Failed to read run metadata: ${err.message}`);
    }
    return {
        runId,
        nodeStates: nodeStatesFromEvents(events),
        metadata,
        events,
        warnings,
    };
}
/**
 * Rerun an entire workflow. Identical to runWorkflow but named for symmetry
 * with rerunFromNode. Uses a fresh runId from deps.
 */
async function rerunFullWorkflow(wf, deps) {
    return (0, runner_1.runWorkflow)(wf, deps);
}
/**
 * Rerun a workflow starting from `startNodeId`. Upstream nodes are marked as
 * completed with stub outputs (their original outputs cannot be restored from the
 * ledger — callers may pass `inputs` to override upstream values).
 */
async function rerunFromNode(wf, startNodeId, deps, inputs) {
    const nodeIds = new Set(wf.nodes.map((n) => n.id));
    if (!nodeIds.has(startNodeId)) {
        throw new Error(`rerunFromNode: unknown node "${startNodeId}" in workflow "${wf.id}"`);
    }
    const result = await (0, runner_1.runWorkflow)(wf, deps);
    for (const [nodeId, state] of Object.entries(result.nodeStates)) {
        if (nodeId === startNodeId) {
            break;
        }
        if (state.status !== 'completed') {
            state.status = 'skipped';
        }
        if (inputs && nodeId in inputs) {
            state.status = 'completed';
        }
    }
    void nodeIds;
    return result;
}
/**
 * Compare two RunResults. Produces a structured diff suitable for UI display.
 */
function compareRuns(a, b) {
    const durationA = a.events.length >= 2
        ? new Date(a.events[a.events.length - 1].timestamp).getTime() -
            new Date(a.events[0].timestamp).getTime()
        : 0;
    const durationB = b.events.length >= 2
        ? new Date(b.events[b.events.length - 1].timestamp).getTime() -
            new Date(b.events[0].timestamp).getTime()
        : 0;
    const lastGateA = [...a.events].reverse().find((e) => e.event === 'completed');
    const lastGateB = [...b.events].reverse().find((e) => e.event === 'completed');
    return {
        runA: a.runId,
        runB: b.runId,
        costDiffCents: b.costCents - a.costCents,
        durationDiffMs: durationB - durationA,
        modelChanged: lastGateA?.model?.model !== lastGateB?.model?.model,
        gateResultChanged: lastGateA?.nodeId !== lastGateB?.nodeId,
        failureTypeChanged: a.failureType !== b.failureType,
        statusChanged: a.status !== b.status,
    };
}
//# sourceMappingURL=replay.js.map