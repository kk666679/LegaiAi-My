"use strict";
/**
 * workflowExecutor.ts — the bridge from Workflow Lab runs to the Playbook
 * Experiment Runner (AWL-WIRE-3).
 *
 * AWL-2's `runPlaybookExperiment` takes an injected executor so it never owns
 * a model transport. This module supplies the production executor: run a real
 * workflow graph through {@link runWorkflow} and translate the {@link RunResult}
 * into the {@link ExperimentExecution} the experiment pass scores — status,
 * cost, duration, gate counts (via the same summarizer the ledger uses), and
 * a verifier outcome derived from gates: verifierPass only when the run
 * completed with zero failed gates.
 *
 * Pure translation + composition. The safety posture is inherited: with
 * default deps the command runner refuses and the model provider is a mock,
 * so wiring this bridge cannot by itself cause a paid call.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runResultToExecution = runResultToExecution;
exports.buildWorkflowExecutor = buildWorkflowExecutor;
exports.buildAutoWorkflowExecutor = buildAutoWorkflowExecutor;
const runner_1 = require("../runner");
const runLedger_1 = require("../runLedger");
const graph_1 = require("./graph");
/** Translate a finished workflow run into experiment evidence. Pure. */
function runResultToExecution(result) {
    // Two WorkflowRunEvent flavors exist (runner-state vs ledger); they are
    // wire-compatible for every field the summarizer reads (failureType,
    // retryCount, artifacts, tokens, gateResults) — only the `model` metadata
    // shape differs, which the summarizer never touches.
    const summary = (0, runLedger_1.summarizeRunRecords)(result.runId, undefined, result.events);
    const durationMs = Math.max(0, Date.parse(result.endedAt) - Date.parse(result.startedAt));
    return {
        run: {
            runId: result.runId,
            workflowId: result.workflowId,
            status: result.status,
            costCents: result.costCents,
            durationMs: Number.isFinite(durationMs) ? durationMs : undefined,
            failureTypes: result.failureType ? [result.failureType] : summary.failureTypes,
            gateCount: summary.gateCount,
            failedGateCount: summary.failedGateCount,
            retryCount: summary.retryCount,
            inputTokens: summary.inputTokens,
            outputTokens: summary.outputTokens,
            artifactCount: summary.artifactCount,
            eventCount: summary.eventCount,
        },
        review: {
            verifierPass: result.status === 'completed' && summary.failedGateCount === 0 && summary.gateCount > 0
                ? true
                : result.status === 'completed' && summary.gateCount === 0
                    ? undefined // no gates ran — don't claim verification that never happened
                    : false,
        },
    };
}
/**
 * Build the injected executor for {@link runPlaybookExperiment}: every call
 * runs `wf` through the Workflow Lab runner with the supplied deps. The
 * scaffold argument is accepted (the experiment runner passes the playbook
 * that was selected/tuned) but the workflow graph is the caller's choice —
 * scaffold-driven graph construction is the next seam up.
 */
function buildWorkflowExecutor(wf, deps) {
    return async (_scaffold) => runResultToExecution(await (0, runner_1.runWorkflow)(wf, deps));
}
/**
 * PB-GRAPH-1: the fully self-driving executor — the graph is DERIVED from
 * whichever playbook the experiment selected/tuned, per call, via
 * {@link buildPlaybookWorkflow}. With default deps this stays offline
 * (refusing command runner, mock model provider); supply real deps + gates
 * to run live.
 */
function buildAutoWorkflowExecutor(deps, opts = {}) {
    return async (scaffold) => runResultToExecution(await (0, runner_1.runWorkflow)((0, graph_1.buildPlaybookWorkflow)(scaffold, opts), deps));
}
//# sourceMappingURL=workflowExecutor.js.map