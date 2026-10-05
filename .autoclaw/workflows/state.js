"use strict";
/**
 * state.ts — Workflow run state, the minimal local DSL contract, and the
 * JSONL run ledger for the WL-1 headless runner.
 *
 * ── WL-0 INTEGRATION SEAM (read this before editing) ────────────────────────
 * WL-1 (this milestone) is the headless runner. It depends on the WL-0
 * foundation types that are owned by a CONCURRENT agent (codex,
 * claim WL-0-foundation):
 *
 *   - src/diagnostics/failureTypes.ts   → WorkflowFailureType + helpers (WL-0.1)
 *   - src/workflows/types.ts            → WorkflowDefinition/Node/Edge (WL-0.2)
 *   - src/workflows/validate.ts         → graph validator               (WL-0.3)
 *   - src/workflows/runLedger.ts        → JSONL ledger                   (WL-0.4)
 *
 * To avoid a shared master-working-tree COMPILE RACE (importing files that a
 * peer is still writing breaks `tsc -p ./` for everyone), WL-1 ships a
 * SELF-CONTAINED local contract here: a minimal, forward-compatible subset of
 * the same shapes, using the same schema strings and field names WL-0 will
 * export. When WL-0 lands, the swap is mechanical:
 *
 *   1. Replace the `WorkflowFailureType` union below with a re-export from
 *      `../diagnostics`.
 *   2. Replace `WorkflowDefinition/WorkflowNode/WorkflowEdge` with re-exports
 *      from `./types`.
 *   3. Replace `appendRunEvent`/`readRun` here with `./runLedger`.
 *
 * Every local type below is intentionally a STRUCTURAL subset so a WL-0 value
 * assigns to it without change. Unknown future fields are preserved.
 * ────────────────────────────────────────────────────────────────────────────
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.refusingCommandRunner = exports.defaultMockModelProvider = exports.WorkflowRunLedger = exports.RunState = exports.RUN_EVENT_SCHEMA = exports.WORKFLOW_SCHEMA = exports.normalizeFailureType = exports.isHumanRequired = exports.isEscalationCandidate = exports.isRetryableFailure = void 0;
exports.readRunEvents = readRunEvents;
const fs = require("fs");
const path = require("path");
var failureTypes_1 = require("../diagnostics/failureTypes");
Object.defineProperty(exports, "isRetryableFailure", { enumerable: true, get: function () { return failureTypes_1.isRetryableFailure; } });
Object.defineProperty(exports, "isEscalationCandidate", { enumerable: true, get: function () { return failureTypes_1.isEscalationCandidate; } });
Object.defineProperty(exports, "isHumanRequired", { enumerable: true, get: function () { return failureTypes_1.isHumanRequired; } });
Object.defineProperty(exports, "normalizeFailureType", { enumerable: true, get: function () { return failureTypes_1.normalizeFailureType; } });
exports.WORKFLOW_SCHEMA = 'autoclaw.workflow.v1';
exports.RUN_EVENT_SCHEMA = 'autoclaw.workflowRunEvent.v1';
/**
 * Mutable run state threaded through node execution. The runner owns one of
 * these per run; node executors read/write outputs and append events.
 */
class RunState {
    constructor(opts) {
        this.nodeStates = {};
        this.events = [];
        this.costCents = 0;
        this.halted = false;
        this.humanRequired = false;
        this.runId = opts.runId;
        this.workflowId = opts.workflowId;
        this.startedAt = opts.startedAt;
        this.ledger = opts.ledger ?? null;
    }
    setNode(nodeId, patch) {
        const prev = this.nodeStates[nodeId] ?? { nodeId, status: 'pending' };
        const next = { ...prev, ...patch, nodeId };
        this.nodeStates[nodeId] = next;
        return next;
    }
    /** Append an event to the in-memory log AND the persistent JSONL ledger. */
    emit(ev) {
        const full = {
            schema: exports.RUN_EVENT_SCHEMA,
            runId: this.runId,
            ...ev,
        };
        if (typeof full.tokens?.costCents === 'number') {
            this.costCents += full.tokens.costCents;
        }
        this.events.push(full);
        if (this.ledger) {
            this.ledger.append(full);
        }
        return full;
    }
    ledgerDir() {
        return this.ledger ? this.ledger.dir : '';
    }
}
exports.RunState = RunState;
// ===========================================================================
// JSONL run ledger (local shim of WL-0.4 src/workflows/runLedger.ts)
// ===========================================================================
/**
 * Append-only JSONL ledger under
 * `.autoclaw/workflows/runs/<runId>/events.jsonl` plus a `run.json` summary.
 * No prompt/response content is ever written — only cost/decision rows.
 *
 * Superseded by WL-0.4 `src/workflows/runLedger.ts` (same on-disk layout).
 */
class WorkflowRunLedger {
    constructor(workspaceRoot, runId) {
        this.dir = path.join(workspaceRoot, '.autoclaw', 'workflows', 'runs', runId);
        this.eventsPath = path.join(this.dir, 'events.jsonl');
        this.runPath = path.join(this.dir, 'run.json');
        fs.mkdirSync(this.dir, { recursive: true });
    }
    append(ev) {
        fs.appendFileSync(this.eventsPath, JSON.stringify(ev) + '\n', 'utf8');
    }
    writeRunMeta(meta) {
        fs.writeFileSync(this.runPath, JSON.stringify(meta, null, 2), 'utf8');
    }
}
exports.WorkflowRunLedger = WorkflowRunLedger;
/**
 * Default model provider: deterministic, offline, zero-cost. Returns a stable
 * stub completion and reports as a local provider. Replace via RunnerDeps to
 * route to real providers.
 */
exports.defaultMockModelProvider = {
    async complete(req) {
        const iter = req.iteration ?? 0;
        return {
            text: `mock-completion(intent=${req.intent ?? 'none'},iteration=${iter})`,
            provider: 'mock',
            model: iter >= 1 ? 'mock-strong' : 'mock-fast',
            locality: 'local',
            selectionReason: iter >= 1
                ? 'escalated to stronger local mock after prior failure'
                : 'cheapest eligible local mock',
            tokens: { input: 0, output: 0, costCents: 0 },
        };
    },
};
/**
 * Default command runner: refuses to execute. Tool/gate nodes that need a real
 * command must be given an explicit CommandRunner via RunnerDeps. This keeps
 * the runner safe-by-default (no surprise shell execution).
 */
const refusingCommandRunner = async () => ({
    exitCode: 127,
    stdout: '',
    stderr: 'no CommandRunner configured: tool/gate command execution is disabled',
    durationMs: 0,
});
exports.refusingCommandRunner = refusingCommandRunner;
/**
 * Read a run's events back from its JSONL ledger. Corrupt lines are skipped
 * with a console warning rather than throwing (WL-0.4 acceptance criterion).
 */
function readRunEvents(workspaceRoot, runId) {
    const p = path.join(workspaceRoot, '.autoclaw', 'workflows', 'runs', runId, 'events.jsonl');
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
            // eslint-disable-next-line no-console
            console.warn(`[workflow] skipping corrupt ledger line in run ${runId}`);
        }
    }
    return out;
}
//# sourceMappingURL=state.js.map