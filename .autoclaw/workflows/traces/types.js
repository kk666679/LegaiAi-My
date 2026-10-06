/**
 * types.ts — Trace Ledger row contracts (TL-1, adaptive-workflow-learning).
 *
 * A trace row is one VERIFIED EPISODE: who ran what, with which model/playbook,
 * touching which files, judged how, at what cost. Rows are the training/eval/
 * export substrate for Adaptive Workflow Learning (spec §Trace Ledger) and the
 * data source for the panel's per-session usage view.
 *
 * Two hard rules from the spec:
 *   1. NO prompt bodies, chain-of-thought, or raw model responses — summaries
 *      and identifiers only. {@link ../traces/ledger}.sanitizeTraceRow enforces
 *      this defensively at write time.
 *   2. Rows must JOIN with what already exists: scaffold score rows (runId),
 *      workflow run summaries (runId), cost-ledger rows (session/agent), and
 *      Context Spine blocks (opaque `context_block_ids` — CS-1 owns their
 *      shape; this module never parses them).
 *
 * Field naming is snake_case to match the comms/JSONL conventions the rest of
 * the coordination plane uses (heartbeats, votes, handoffs).
 */

export let TRACE_SCHEMA = void 0;
TRACE_SCHEMA = 'autoclaw.trace.v1';
//# sourceMappingURL=types.js.map
