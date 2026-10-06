import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import * as types_1 from './types.js';

/**
 * ledger.ts — Trace Ledger writer/reader (TL-1, adaptive-workflow-learning).
 *
 * Append-only JSONL under `.autoclaw/workflows/traces/`, sharded by day
 * (`traces-YYYY-MM-DD.jsonl`) so retention and export can operate on whole
 * files. Mirrors runLedger.ts conventions: plain fs, never throws on missing
 * dirs, warnings over exceptions.
 *
 * Privacy is enforced HERE, not trusted to callers: {@link sanitizeTraceRow}
 * drops any key that smells like a prompt/response body and hard-caps string
 * lengths, so a misbehaving caller cannot turn the ledger into a transcript
 * store (spec: "Trace rows must avoid prompt/response body storage").
 *
 * @see ./types (row contracts)
 * @see ../runLedger (per-run event ledger this joins with via run_id)
 */

export let MAX_TRACE_STRING_LENGTH = exports.WORKFLOW_TRACES_DIR = void 0;

export let WORKFLOW_TRACES_DIR = path.join('.autoclaw', 'workflows', 'traces');
/** Longest string value allowed in a row — beyond this it's a body, not a summary. */
MAX_TRACE_STRING_LENGTH = 2000;
/** Keys that indicate prompt/response/CoT content. Dropped wherever they appear. */
const FORBIDDEN_KEY_PATTERN = /prompt|response_body|raw_response|completion|messages|chain_of_thought|thought|transcript|system_prompt/i;
function tracesDir(workspaceRoot) {
    return path.join(workspaceRoot, exports.WORKFLOW_TRACES_DIR);
}
/** Shard file for a given ISO timestamp (UTC day). */
function traceShardPath(workspaceRoot, atIso) {
    const day = /^\d{4}-\d{2}-\d{2}/.exec(atIso)?.[0] ?? 'undated';
    return path.join(tracesDir(workspaceRoot), `traces-${day}.jsonl`);
}
/* -------------------------------------------------------------------------- */
/*  Sanitize                                                                  */
/* -------------------------------------------------------------------------- */
/**
 * Deep-copy `value` while dropping forbidden keys and truncating long strings.
 * Arrays/objects are walked; functions and cycles are dropped (JSONL rows are
 * data). Pure — the input is never mutated.
 */
function sanitizeValue(value, seen) {
    if (typeof value === 'string') {
        return value.length > exports.MAX_TRACE_STRING_LENGTH
            ? value.slice(0, exports.MAX_TRACE_STRING_LENGTH) + '…[truncated]'
            : value;
    }
    if (value === null || typeof value !== 'object') {
        return typeof value === 'function' ? undefined : value;
    }
    if (seen.has(value)) {
        return undefined;
    }
    seen.add(value);
    if (Array.isArray(value)) {
        return value.map((v) => sanitizeValue(v, seen)).filter((v) => v !== undefined);
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
        if (FORBIDDEN_KEY_PATTERN.test(k)) {
            continue;
        }
        const sanitized = sanitizeValue(v, seen);
        if (sanitized !== undefined) {
            out[k] = sanitized;
        }
    }
    return out;
}
/** Enforce the no-bodies rule on a row. Returns a new, safe row. */
function sanitizeTraceRow(row) {
    const safe = sanitizeValue(row, new Set());
    safe.schema = types_1.TRACE_SCHEMA;
    return safe;
}
/* -------------------------------------------------------------------------- */
/*  Append / read                                                             */
/* -------------------------------------------------------------------------- */
/** Fill identity defaults so callers can pass partial episodes. */
function buildTraceRow(partial) {
    return sanitizeTraceRow({
        ...partial,
        schema: types_1.TRACE_SCHEMA,
        trace_id: crypto.randomUUID(),
        at: partial.at ?? new Date().toISOString(),
    });
}
/**
 * AMCE-P1E: build a `context_pack` event row. Joins by (task_id, agent_id) to
 * the episode that follows; `context_block_ids` carries the pack's Context
 * Spine ids so replay/audit can resolve exactly what the agent was handed.
 * Never includes pack markdown.
 */
function buildContextPackTraceRow(input) {
    return buildTraceRow({
        agent_id: input.agent_id,
        task_id: input.task_id,
        session_id: input.session_id,
        event: 'context_pack',
        context_pack: input.pack,
        context_block_ids: input.context_block_ids,
        at: input.at,
    });
}
/** Append one episode. Creates the shard dir on demand; never throws. */
async function appendTraceRow(workspaceRoot, row) {
    try {
        if (!row.agent_id || !row.at) {
            return { ok: false, error: 'trace row requires agent_id and at' };
        }
        const safe = sanitizeTraceRow(row);
        const file = traceShardPath(workspaceRoot, safe.at);
        await fs.promises.mkdir(path.dirname(file), { recursive: true });
        await fs.promises.appendFile(file, JSON.stringify(safe) + '\n', 'utf8');
        return { ok: true, file };
    }
    catch (err) {
        return { ok: false, error: err.message };
    }
}
/** Read episodes across shards, newest first. Malformed lines are skipped. */
async function readTraces(workspaceRoot, filter = {}) {
    const limit = filter.limit ?? 1000;
    let shardNames;
    try {
        shardNames = (await fs.promises.readdir(tracesDir(workspaceRoot)))
            .filter((n) => n.startsWith('traces-') && n.endsWith('.jsonl'))
            .sort()
            .reverse(); // newest shard first
    }
    catch {
        return [];
    }
    const out = [];
    for (const name of shardNames) {
        if (out.length >= limit) {
            break;
        }
        // Skip whole shards older than the since-day (shard name encodes the day).
        if (filter.sinceIso) {
            const shardDay = name.slice('traces-'.length, -'.jsonl'.length);
            if (shardDay < filter.sinceIso.slice(0, 10)) {
                continue;
            }
        }
        let text;
        try {
            text = await fs.promises.readFile(path.join(tracesDir(workspaceRoot), name), 'utf8');
        }
        catch {
            continue;
        }
        for (const line of text.split('\n')) {
            if (!line.trim()) {
                continue;
            }
            let row;
            try {
                row = JSON.parse(line);
            }
            catch {
                continue;
            }
            if (row.schema !== types_1.TRACE_SCHEMA || !row.agent_id || !row.at) {
                continue;
            }
            if (filter.sinceIso && row.at < filter.sinceIso) {
                continue;
            }
            if (filter.agentId && row.agent_id !== filter.agentId) {
                continue;
            }
            if (filter.sessionId && row.session_id !== filter.sessionId) {
                continue;
            }
            if (filter.taskId && row.task_id !== filter.taskId) {
                continue;
            }
            out.push(row);
        }
    }
    out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
    return out.slice(0, limit);
}
/* -------------------------------------------------------------------------- */
/*  Per-session usage rollup (the panel view)                                 */
/* -------------------------------------------------------------------------- */
function addUsage(totals, usage) {
    if (!usage) {
        return;
    }
    totals.input_tokens += usage.input_tokens ?? 0;
    totals.output_tokens += usage.output_tokens ?? 0;
    totals.cost_cents += usage.cost_cents ?? 0;
    if (usage.estimated) {
        totals.estimated = true;
    }
}
/**
 * Roll episodes up into per-(agent, session) summaries: which model the window
 * is on, tokens for the most recent task, and session totals. Rows without a
 * session_id group under the synthetic id `-` so tools that never announce a
 * session still show usage instead of disappearing.
 */
function aggregateSessionUsage(allRows) {
    // AMCE-P1E: only verified episodes carry usage — pack-generation events must
    // not overwrite a session's "last task" chip or add phantom task counts.
    const rows = allRows.filter((r) => !r.event || r.event === 'episode');
    const byKey = new Map();
    // rows arrive newest-first from readTraces; walk oldest-first so "latest wins".
    for (const row of [...rows].reverse()) {
        const sessionId = row.session_id ?? '-';
        const key = `${row.agent_id}|${sessionId}`;
        let s = byKey.get(key);
        if (!s) {
            s = {
                agent_id: row.agent_id,
                session_id: sessionId,
                models: [],
                task_count: 0,
                totals: { input_tokens: 0, output_tokens: 0, cost_cents: 0, estimated: false },
                last_at: row.at,
            };
            byKey.set(key, s);
        }
        if (row.session_label) {
            s.session_label = row.session_label;
        }
        if (row.model) {
            s.model = row.model;
            s.models = [row.model, ...s.models.filter((m) => m !== row.model)];
        }
        addUsage(s.totals, row.usage);
        s.last_task = { task_id: row.task_id, at: row.at, usage: row.usage };
        s.last_at = row.at;
    }
    // Distinct task counts per session.
    const tasksByKey = new Map();
    for (const row of rows) {
        const key = `${row.agent_id}|${row.session_id ?? '-'}`;
        const set = tasksByKey.get(key) ?? new Set();
        if (row.task_id) {
            set.add(row.task_id);
        }
        tasksByKey.set(key, set);
    }
    for (const [key, s] of byKey) {
        s.task_count = tasksByKey.get(key)?.size ?? 0;
    }
    return [...byKey.values()].sort((a, b) => (a.last_at < b.last_at ? 1 : -1));
}
/** Convenience: read + aggregate in one call (what the panel data layer uses). */
async function readSessionUsage(workspaceRoot, filter = {}) {
    return aggregateSessionUsage(await readTraces(workspaceRoot, filter));
}
//# sourceMappingURL=ledger.js.map

export { tracesDir as tracesDir, traceShardPath as traceShardPath, sanitizeTraceRow as sanitizeTraceRow, buildTraceRow as buildTraceRow, buildContextPackTraceRow as buildContextPackTraceRow, appendTraceRow as appendTraceRow, readTraces as readTraces, aggregateSessionUsage as aggregateSessionUsage, readSessionUsage as readSessionUsage };
