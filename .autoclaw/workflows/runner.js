"use strict";
/**
 * runner.ts — Headless workflow execution engine (WL-1.1).
 *
 * Executes a WorkflowDefinition as a DAG of node executors, recording every
 * decision to the run ledger. Loops are bounded — every loop node must carry
 * budget constraints. No model or command is called unless an explicit
 * provider/runner is supplied via RunnerDeps. Safe-by-default.
 *
 * Lifecycle:
 *   1. Validate the workflow graph.
 *   2. Topologically order non-loop nodes.
 *   3. Execute nodes in order, passing upstream outputs along edges.
 *   4. On failure, route through failure-path edges if present, else halt.
 *   5. On HALT signal, emit halted event and return immediately.
 *   6. Write run.json summary to the ledger.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultDeps = defaultDeps;
exports.runWorkflow = runWorkflow;
const state_1 = require("./state");
const validate_1 = require("./validate");
const gateNode_1 = require("./nodes/gateNode");
const loops_1 = require("./loops");
// ---------------------------------------------------------------------------
// Node executor dispatch
// ---------------------------------------------------------------------------
/**
 * Dispatch to the right node executor. Executors are async functions that
 * receive a `NodeContext` and return a `NodeExecResult`. Unknown node types
 * default to a safe mock.
 */
async function executeNode(ctx, nodeMap) {
    const { node, deps } = ctx;
    switch (node.type) {
        case 'gate':
            return (0, gateNode_1.runGateNode)(ctx);
        case 'agent': {
            const req = {
                intent: (node.config.intent ?? node.intent),
                prompt: node.config.prompt ?? `Execute node "${node.id}"`,
                profile: node.config.routingProfile,
                iteration: ctx.iteration,
            };
            const res = await deps.modelProvider.complete(req);
            return {
                status: 'completed',
                output: { text: res.text },
                model: { provider: res.provider, model: res.model, locality: res.locality, selectionReason: res.selectionReason },
                costCents: res.tokens?.costCents ?? 0,
                summary: `agent completed (provider=${res.provider})`,
            };
        }
        case 'tool': {
            const command = node.config.command;
            if (!command) {
                return {
                    status: 'failed',
                    failureType: 'tool_format_invalid',
                    summary: `tool node "${node.id}" missing config.command`,
                };
            }
            const res = await deps.commandRunner(command, {
                cwd: node.config.cwd ?? deps.workspaceRoot,
                timeoutSeconds: node.timeoutSeconds,
            });
            const passed = !res.timedOut && res.exitCode === 0;
            return {
                status: passed ? 'completed' : 'failed',
                output: { exitCode: res.exitCode, stdout: res.stdout },
                failureType: passed ? undefined : (res.timedOut ? 'budget_exhausted' : 'tool_action_illegal'),
                summary: passed ? `tool exit 0` : `tool exit ${res.exitCode}`,
            };
        }
        case 'input':
        case 'context':
        case 'router':
        case 'artifact':
        case 'control':
            // These produce no side effects in WL-1; they pass upstream data through.
            return {
                status: 'completed',
                output: { nodeId: node.id, type: node.type, config: node.config },
                summary: `${node.type} node "${node.id}" passed through`,
            };
        case 'human':
            // Human nodes always halt and request intervention.
            return {
                status: 'failed',
                failureType: 'irreducible_or_needs_human',
                summary: `human node "${node.id}" requires human approval`,
            };
        case 'loop':
            // Loop nodes are handled inline in runWorkflow (needs wf + nodeMap scope).
            // Returning pass-through here; the runner never calls executeNode for loops.
            return {
                status: 'completed',
                output: {},
                summary: `loop node "${node.id}" (delegated to runWorkflow)`,
            };
        default:
            return {
                status: 'completed',
                output: {},
                summary: `unknown node type "${node.type}" — skipped`,
            };
    }
}
// ---------------------------------------------------------------------------
// Topological sort
// ---------------------------------------------------------------------------
/**
 * Kahn's algorithm with loop-node back-edge exclusion.
 *
 * Edges that originate FROM a loop node are excluded from the adjacency
 * graph — they represent back-edges to the loop body that the loop executor
 * manages internally. This allows topological ordering of graphs that
 * contain bounded loops without failing on the apparent cycle.
 *
 * Returns null only for non-loop cycles that cannot be resolved.
 */
function topoOrder(nodes, edges) {
    const loopNodeIds = new Set(nodes.filter((n) => n.type === 'loop').map((n) => n.id));
    const inDegree = new Map();
    const adj = new Map();
    for (const n of nodes) {
        inDegree.set(n.id, 0);
        adj.set(n.id, []);
    }
    for (const e of edges) {
        const from = e.from?.node;
        const to = e.to?.node;
        if (!from || !to || !inDegree.has(from) || !inDegree.has(to))
            continue;
        // Skip back-edges from loop nodes — these are handled by the loop executor
        if (loopNodeIds.has(from))
            continue;
        adj.get(from).push(to);
        inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
    }
    const queue = [...inDegree.entries()]
        .filter(([, deg]) => deg === 0)
        .map(([id]) => id);
    const order = [];
    while (queue.length > 0) {
        const id = queue.shift();
        order.push(id);
        for (const nbr of adj.get(id) ?? []) {
            const deg = (inDegree.get(nbr) ?? 1) - 1;
            inDegree.set(nbr, deg);
            if (deg === 0)
                queue.push(nbr);
        }
    }
    return order.length === nodes.length ? order : null;
}
// ---------------------------------------------------------------------------
// Edge routing helpers
// ---------------------------------------------------------------------------
/** Collect the ids of all nodes reachable from `fromId` via success edges. */
function successTargets(fromId, edges) {
    return edges
        .filter((e) => e.from?.node === fromId)
        .filter((e) => !e.condition?.onFailure)
        .map((e) => e.to.node);
}
/** Collect the ids of all nodes reachable from `fromId` via failure edges. */
function failureTargets(fromId, edges) {
    return edges
        .filter((e) => e.from?.node === fromId)
        .filter((e) => !!e.condition?.onFailure)
        .map((e) => e.to.node);
}
/**
 * Compute the set of node ids that form the body of a loop: nodes reachable
 * from `loopId` via output edges, stopping at any edge that leads back to the
 * loop node itself. Returns a topologically-ordered list of body node ids.
 */
function loopBodyIds(loopId, edges) {
    const visited = new Set();
    const queue = [];
    // Seed with direct successors of the loop node.
    for (const e of edges) {
        if (e.from?.node === loopId && e.to?.node && e.to.node !== loopId) {
            queue.push(e.to.node);
        }
    }
    while (queue.length > 0) {
        const current = queue.shift();
        if (current === loopId || visited.has(current))
            continue;
        visited.add(current);
        for (const e of edges) {
            if (e.from?.node === current && e.to?.node && e.to.node !== loopId && !visited.has(e.to.node)) {
                queue.push(e.to.node);
            }
        }
    }
    return [...visited];
}
// ---------------------------------------------------------------------------
// Node execution with retry
// ---------------------------------------------------------------------------
async function executeNodeWithRetry(ctx, nodeMap) {
    const maxAttempts = ctx.node.retry?.maxAttempts ?? 1;
    let last = { status: 'failed', failureType: 'unknown_external' };
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (ctx.deps.shouldHalt?.()) {
            return { status: 'failed', failureType: 'unknown_external', summary: 'halted before retry' };
        }
        last = await executeNode(ctx, nodeMap);
        if (last.status === 'completed')
            return last;
        if (last.failureType && (0, state_1.isHumanRequired)(last.failureType))
            return last;
        // Log retry event if more attempts remain
        if (attempt + 1 < maxAttempts) {
            ctx.run.emit({
                nodeId: ctx.node.id,
                event: 'retrying',
                timestamp: ctx.deps.now(),
                failureType: last.failureType,
                summary: `retry ${attempt + 1}/${maxAttempts - 1}`,
            });
        }
    }
    return last;
}
// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------
/** Default deps for headless/test execution — offline, zero-cost, no I/O. */
function defaultDeps(workspaceRoot, overrides) {
    let counter = 0;
    return {
        workspaceRoot,
        now: () => new Date().toISOString(),
        newRunId: () => `run-${++counter}-${Date.now()}`,
        commandRunner: state_1.refusingCommandRunner,
        modelProvider: state_1.defaultMockModelProvider,
        persistLedger: false,
        ...overrides,
    };
}
/**
 * Execute a workflow graph headlessly.
 *
 * All node outputs and run events are recorded in the returned `RunResult`.
 * When `deps.persistLedger` is true, events are also written to
 * `.autoclaw/workflows/runs/<runId>/events.jsonl`.
 */
async function runWorkflow(wf, deps) {
    // ── 1. Validate ───────────────────────────────────────────────────────────
    const vr = (0, validate_1.validateWorkflow)(wf);
    if (!vr.valid) {
        const msg = vr.diagnostics.map((d) => d.message).join('; ');
        const startedAt = deps.now();
        return {
            runId: deps.newRunId(),
            workflowId: wf.id,
            status: 'failed',
            stopReason: 'validation_error',
            failureType: 'tool_format_invalid',
            nodeStates: {},
            events: [],
            costCents: 0,
            ledgerDir: '',
            startedAt,
            endedAt: deps.now(),
        };
    }
    // ── 2. Initialise run state ────────────────────────────────────────────────
    const runId = deps.newRunId();
    const startedAt = deps.now();
    const ledger = deps.persistLedger
        ? new state_1.WorkflowRunLedger(deps.workspaceRoot, runId)
        : null;
    const run = new state_1.RunState({ runId, workflowId: wf.id, startedAt, ledger });
    run.emit({ nodeId: '_run', event: 'started', timestamp: startedAt, summary: wf.name ?? wf.id });
    // ── 3. Topological order ──────────────────────────────────────────────────
    const order = topoOrder(wf.nodes, wf.edges);
    if (!order) {
        run.emit({ nodeId: '_run', event: 'failed', timestamp: deps.now(), failureType: 'tool_format_invalid', summary: 'cycle detected' });
        return buildResult(run, 'failed', 'validation_error', 'tool_format_invalid', startedAt, deps.now());
    }
    const nodeMap = new Map(wf.nodes.map((n) => [n.id, n]));
    // ── 4. Execute nodes ──────────────────────────────────────────────────────
    let stopReason = 'completed';
    let runFailureType;
    const upstream = {};
    for (const nodeId of order) {
        // HALT check before each node
        if (deps.shouldHalt?.() || run.halted) {
            run.halted = true;
            run.emit({ nodeId, event: 'halted', timestamp: deps.now(), summary: 'halt requested' });
            stopReason = 'halt_requested';
            break;
        }
        const node = nodeMap.get(nodeId);
        if (!node)
            continue;
        // Loop nodes are executed inline (they need wf + nodeMap scope).
        if (node.type === 'loop') {
            const bodyIds = loopBodyIds(node.id, wf.edges);
            const loopCtx = { node, run, deps, upstream };
            let loopResult;
            try {
                loopResult = await (0, loops_1.runLoopNode)(loopCtx, async (iteration, bodyUpstream) => {
                    let lastResult = { status: 'completed', output: {}, summary: 'loop body empty' };
                    for (const bodyNodeId of bodyIds) {
                        if (deps.shouldHalt?.()) {
                            return { status: 'failed', failureType: 'irreducible_or_needs_human', summary: 'halted inside loop' };
                        }
                        const bodyNode = nodeMap.get(bodyNodeId);
                        if (!bodyNode)
                            continue;
                        const bodyCtx = { ...loopCtx, node: bodyNode, iteration, upstream: bodyUpstream };
                        const r = await executeNodeWithRetry(bodyCtx, nodeMap);
                        if (r.output !== undefined) {
                            bodyUpstream[bodyNodeId] = r.output;
                        }
                        if (r.status === 'failed') {
                            return r;
                        }
                        lastResult = r;
                    }
                    return lastResult;
                });
            }
            catch (err) {
                loopResult = {
                    status: 'failed',
                    failureType: 'unknown_external',
                    summary: String(err instanceof Error ? err.message : err),
                };
            }
            const loopEndedAt = deps.now();
            if (loopResult.costCents) {
                run.costCents += loopResult.costCents;
            }
            run.setNode(nodeId, {
                status: loopResult.status,
                failureType: loopResult.failureType,
                endedAt: loopEndedAt,
                attempts: 1,
            });
            run.emit({
                nodeId,
                event: loopResult.status === 'completed' ? 'completed' : 'failed',
                timestamp: loopEndedAt,
                failureType: loopResult.failureType,
                summary: loopResult.summary,
                tokens: loopResult.costCents != null ? { costCents: loopResult.costCents } : undefined,
            });
            if (loopResult.status === 'failed') {
                const hasFallback = failureTargets(nodeId, wf.edges).length > 0;
                if (!hasFallback) {
                    stopReason = (0, state_1.isHumanRequired)(loopResult.failureType ?? 'unknown_external')
                        ? 'human_required'
                        : 'node_failed';
                    runFailureType = loopResult.failureType;
                    break;
                }
            }
            if (loopResult.output !== undefined) {
                upstream[nodeId] = loopResult.output;
            }
            continue;
        }
        const nodeState = run.setNode(nodeId, { status: 'running', startedAt: deps.now() });
        run.emit({ nodeId, event: 'started', timestamp: nodeState.startedAt });
        const ctx = { node, run, deps, upstream };
        let result;
        try {
            result = await executeNodeWithRetry(ctx, nodeMap);
        }
        catch (err) {
            result = {
                status: 'failed',
                failureType: 'unknown_external',
                summary: String(err instanceof Error ? err.message : err),
            };
        }
        const endedAt = deps.now();
        if (result.costCents) {
            run.costCents += result.costCents;
        }
        if (result.output !== undefined) {
            upstream[nodeId] = result.output;
        }
        run.setNode(nodeId, {
            status: result.status,
            failureType: result.failureType,
            endedAt,
            attempts: (nodeState.attempts ?? 0) + 1,
        });
        run.emit({
            nodeId,
            event: result.status === 'completed' ? 'completed' : 'failed',
            timestamp: endedAt,
            failureType: result.failureType,
            model: result.model,
            summary: result.summary,
            tokens: result.costCents != null ? { costCents: result.costCents } : undefined,
        });
        if (result.status === 'failed') {
            const hasFallback = failureTargets(nodeId, wf.edges).length > 0;
            if (!hasFallback) {
                stopReason = (0, state_1.isHumanRequired)(result.failureType ?? 'unknown_external')
                    ? 'human_required'
                    : 'node_failed';
                runFailureType = result.failureType;
                break;
            }
            // failure-path edges present — mark skipped nodes that aren't reachable
        }
    }
    // ── 5. Finalise ───────────────────────────────────────────────────────────
    const endedAt = deps.now();
    const runStatus = stopReason === 'completed' ? 'completed' :
        stopReason === 'halt_requested' ? 'halted' :
            stopReason === 'human_required' ? 'human_required' :
                'failed';
    run.emit({
        nodeId: '_run',
        event: runStatus === 'completed' ? 'completed' : runStatus === 'halted' ? 'halted' : 'failed',
        timestamp: endedAt,
        failureType: runFailureType,
        summary: `run ${stopReason} (cost=${run.costCents}¢)`,
    });
    if (ledger) {
        ledger.writeRunMeta({
            runId,
            workflowId: wf.id,
            status: runStatus,
            stopReason,
            startedAt,
            endedAt,
            costCents: run.costCents,
            eventCount: run.events.length,
        });
    }
    const result = buildResult(run, runStatus, stopReason, runFailureType, startedAt, endedAt);
    // CS-3 producer: when the run persisted a ledger, also cache it as one
    // whole-run context window (gate evidence + failure types) for later
    // replay. Best-effort — a cache failure never fails the run.
    if (deps.persistLedger) {
        try {
            const { appendWholeRunWindow } = await Promise.resolve().then(() => require('./runLedger'));
            // Runner-state events are wire-compatible with the ledger flavor for
            // every field the window builder reads (failureType, gateResults).
            await appendWholeRunWindow(deps.workspaceRoot, {
                runId: result.runId,
                startedAt,
                endedAt,
                events: result.events,
            });
        }
        catch { /* window cache is advisory */ }
    }
    return result;
}
function buildResult(run, status, stopReason, failureType, startedAt, endedAt) {
    return {
        runId: run.runId,
        workflowId: run.workflowId,
        status,
        stopReason,
        failureType,
        nodeStates: run.nodeStates,
        events: run.events,
        costCents: run.costCents,
        ledgerDir: run.ledgerDir(),
        startedAt,
        endedAt,
    };
}
//# sourceMappingURL=runner.js.map