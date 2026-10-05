"use strict";
/**
 * graph.ts — scaffold-driven workflow-graph construction (PB-GRAPH-1).
 *
 * Closes the seam AWL-WIRE-3 documented: `buildWorkflowExecutor` could run a
 * workflow, but the graph was the caller's problem. This module derives the
 * graph FROM the playbook, so the experiment loop becomes fully self-driving:
 * select a playbook → build its graph → run → guard → score → trace.
 *
 * The mapping is deliberately conservative and linear:
 *
 *   input(task) → [context(contextPlanId)] → agent(model) → [gate…] → artifact
 *
 *   - a `context` node appears only when the playbook names a contextPlanId;
 *   - the `agent` node carries routerProfile + promptHarnessId + intent so
 *     model providers and traces see the playbook's routing decisions;
 *   - `gate` nodes come from caller-supplied commands (project-specific —
 *     a playbook knows THAT it gates, not what your test command is); none
 *     supplied ⇒ no gate nodes, and downstream scoring honestly reports
 *     zero gates rather than inventing verification;
 *   - the playbook's loop policy maps onto the agent node's RETRY budget
 *     (maxIterations, capped) — the runner's bounded retry is the faithful
 *     v1 of "loop this strategy"; richer loop-node wrapping can follow.
 *
 * Pure — no I/O, no clock. Lineage lands in workflow metadata so the Trace
 * Ledger rows produced by the run join back to the playbook.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPlaybookWorkflow = buildPlaybookWorkflow;
const state_1 = require("../state");
/** Derive a runnable workflow definition from a playbook. Pure. */
function buildPlaybookWorkflow(scaffold, opts = {}) {
    const nodes = [];
    const edges = [];
    const chain = [];
    const push = (node) => {
        if (chain.length > 0) {
            const from = chain[chain.length - 1];
            edges.push({ id: `e-${from}-${node.id}`, from: { node: from }, to: { node: node.id } });
        }
        nodes.push(node);
        chain.push(node.id);
    };
    push({
        id: 'task-input',
        type: 'input',
        kind: 'task',
        config: {
            intent: scaffold.taskIntent,
            playbook_id: scaffold.id,
            ...(opts.task ? { task: opts.task } : {}),
        },
    });
    if (scaffold.contextPlanId) {
        push({
            id: 'context',
            type: 'context',
            kind: 'context-pack',
            config: {
                contextPlanId: scaffold.contextPlanId,
                ...(typeof scaffold.metadata?.contextMode === 'string'
                    ? { mode: scaffold.metadata.contextMode }
                    : {}),
            },
        });
    }
    // Loop policy → bounded retry on the work node (the runner enforces it).
    const loopPolicy = scaffold.metadata?.loopPolicy;
    const maxAttempts = Math.max(1, Math.min(opts.maxRetryAttempts ?? 5, Math.floor(loopPolicy?.maxIterations ?? 1)));
    push({
        id: 'work',
        type: 'agent',
        kind: 'model',
        config: {
            // The playbook names a routing POSTURE, not a concrete model — the
            // router resolves it at dispatch. 'router' satisfies the validator's
            // agent-model contract while keeping resolution where it belongs.
            provider: 'router',
            intent: scaffold.taskIntent,
            routingProfile: scaffold.routerProfile,
            ...(scaffold.promptHarnessId ? { promptHarnessId: scaffold.promptHarnessId } : {}),
            ...(opts.task ? { task: opts.task, prompt: opts.task } : {}),
        },
        ...(maxAttempts > 1 ? { retry: { maxAttempts } } : {}),
    });
    for (const gate of opts.gates ?? []) {
        push({
            id: `gate-${gate.id.replace(/[^A-Za-z0-9._-]/g, '_')}`,
            type: 'gate',
            kind: 'command',
            config: { command: gate.command },
            ...(gate.timeoutSeconds ? { timeoutSeconds: gate.timeoutSeconds } : {}),
        });
    }
    push({ id: 'result', type: 'artifact', kind: 'report', config: {} });
    return {
        schema: state_1.WORKFLOW_SCHEMA,
        id: `wf-playbook-${scaffold.id}`,
        name: `Playbook ${scaffold.id}`,
        nodes,
        edges,
        metadata: {
            playbook_id: scaffold.id,
            ...(scaffold.parentScaffoldId ? { playbook_parent_id: scaffold.parentScaffoldId } : {}),
            ...(scaffold.promptHarnessId ? { harness_id: scaffold.promptHarnessId } : {}),
            routerProfile: scaffold.routerProfile,
            ...(scaffold.loopPolicyId ? { loop_policy_id: scaffold.loopPolicyId } : {}),
        },
    };
}
//# sourceMappingURL=graph.js.map