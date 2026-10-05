"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKFLOW_RUN_CONTEXT_FILE = exports.WORKFLOW_EVENTS_FILE = exports.WORKFLOW_RUN_FILE = exports.WORKFLOW_RUNS_DIR = void 0;
exports.runDir = runDir;
exports.runMetadataPath = runMetadataPath;
exports.runEventsPath = runEventsPath;
exports.writeRunMetadata = writeRunMetadata;
exports.appendRunEvent = appendRunEvent;
exports.readRun = readRun;
exports.listRuns = listRuns;
exports.summarizeRun = summarizeRun;
exports.summarizeRunRecords = summarizeRunRecords;
exports.runContextWindowsPath = runContextWindowsPath;
exports.readRunContextWindows = readRunContextWindows;
exports.appendRunContextWindow = appendRunContextWindow;
exports.appendWholeRunWindow = appendWholeRunWindow;
exports.collectRunContextWindows = collectRunContextWindows;
const fs = require("fs");
const path = require("path");
const contextSpine_1 = require("../intelligence/contextSpine");
const types_1 = require("./types");
exports.WORKFLOW_RUNS_DIR = path.join('.autoclaw', 'workflows', 'runs');
exports.WORKFLOW_RUN_FILE = 'run.json';
exports.WORKFLOW_EVENTS_FILE = 'events.jsonl';
/** CS-3: per-run contiguous context windows, cached for later replay. */
exports.WORKFLOW_RUN_CONTEXT_FILE = 'context-windows.jsonl';
function runDir(workspaceRoot, runId) {
    return path.join(workspaceRoot, exports.WORKFLOW_RUNS_DIR, runId);
}
function runMetadataPath(workspaceRoot, runId) {
    return path.join(runDir(workspaceRoot, runId), exports.WORKFLOW_RUN_FILE);
}
function runEventsPath(workspaceRoot, runId) {
    return path.join(runDir(workspaceRoot, runId), exports.WORKFLOW_EVENTS_FILE);
}
async function writeRunMetadata(workspaceRoot, metadata) {
    const file = runMetadataPath(workspaceRoot, metadata.runId);
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    await fs.promises.writeFile(file, JSON.stringify(metadata, null, 2) + '\n', 'utf8');
}
async function appendRunEvent(workspaceRoot, event) {
    const file = runEventsPath(workspaceRoot, event.runId);
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    const record = sanitizeRunEvent({
        ...event,
        schema: types_1.WORKFLOW_RUN_EVENT_SCHEMA,
    });
    await fs.promises.appendFile(file, JSON.stringify(record) + '\n', 'utf8');
}
async function readRun(workspaceRoot, runId) {
    const warnings = [];
    const metadata = await readMetadata(workspaceRoot, runId, warnings);
    const events = await readEvents(workspaceRoot, runId, warnings);
    return { metadata, events, warnings };
}
async function listRuns(workspaceRoot) {
    const base = path.join(workspaceRoot, exports.WORKFLOW_RUNS_DIR);
    let entries;
    try {
        entries = await fs.promises.readdir(base, { withFileTypes: true });
    }
    catch {
        return [];
    }
    const runs = [];
    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }
        const warnings = [];
        const metadata = await readMetadata(workspaceRoot, entry.name, warnings);
        if (metadata) {
            runs.push(metadata);
        }
    }
    return runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}
async function summarizeRun(workspaceRoot, runId) {
    const run = await readRun(workspaceRoot, runId);
    return summarizeRunRecords(runId, run.metadata, run.events);
}
function summarizeRunRecords(runId, metadata, events) {
    const startedAt = metadata?.startedAt ?? firstTimestamp(events);
    const completedAt = metadata?.completedAt ?? lastTerminalTimestamp(events);
    const status = metadata?.status ?? statusFromEvents(events);
    const failures = new Set();
    let artifactCount = 0;
    let costCents = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let gateCount = 0;
    let failedGateCount = 0;
    let retryCount = 0;
    for (const event of events) {
        if (event.failureType) {
            failures.add(event.failureType);
        }
        if (event.event === 'retrying') {
            retryCount += 1;
        }
        retryCount += event.retryCount ?? 0;
        artifactCount += event.artifacts?.length ?? 0;
        costCents += event.tokens?.costCents ?? 0;
        inputTokens += event.tokens?.input ?? 0;
        outputTokens += event.tokens?.output ?? 0;
        for (const gate of event.gateResults ?? []) {
            gateCount += 1;
            if (!gate.passed) {
                failedGateCount += 1;
                if (gate.failureType) {
                    failures.add(gate.failureType);
                }
            }
        }
    }
    const startMs = startedAt ? new Date(startedAt).getTime() : NaN;
    const endMs = completedAt ? new Date(completedAt).getTime() : NaN;
    return {
        runId,
        workflowId: metadata?.workflowId,
        status,
        startedAt,
        completedAt,
        durationMs: Number.isFinite(startMs) && Number.isFinite(endMs) ? Math.max(0, endMs - startMs) : undefined,
        costCents,
        inputTokens,
        outputTokens,
        failureTypes: [...failures].sort(),
        artifactCount,
        eventCount: events.length,
        gateCount,
        failedGateCount,
        retryCount,
    };
}
async function readMetadata(workspaceRoot, runId, warnings) {
    try {
        const raw = await fs.promises.readFile(runMetadataPath(workspaceRoot, runId), 'utf8');
        return JSON.parse(raw);
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            warnings.push(`Failed to read run metadata for ${runId}: ${err.message}`);
        }
        return undefined;
    }
}
async function readEvents(workspaceRoot, runId, warnings) {
    let raw;
    try {
        raw = await fs.promises.readFile(runEventsPath(workspaceRoot, runId), 'utf8');
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            warnings.push(`Failed to read run events for ${runId}: ${err.message}`);
        }
        return [];
    }
    const events = [];
    raw.replace(/^\uFEFF/, '').split('\n').forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
            return;
        }
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed.runId === runId && parsed.nodeId && parsed.event) {
                events.push(parsed);
            }
            else {
                warnings.push(`Skipped invalid event line ${index + 1} for ${runId}.`);
            }
        }
        catch {
            warnings.push(`Skipped corrupt event line ${index + 1} for ${runId}.`);
        }
    });
    return events;
}
function sanitizeRunEvent(event) {
    return scrubSensitive(event);
}
function scrubSensitive(value) {
    if (Array.isArray(value)) {
        return value.map(scrubSensitive);
    }
    if (!value || typeof value !== 'object') {
        return value;
    }
    const out = {};
    for (const [key, child] of Object.entries(value)) {
        const lowered = key.toLowerCase();
        if (lowered.includes('prompt') ||
            lowered.includes('response') ||
            lowered.includes('secret') ||
            lowered.includes('apikey') ||
            lowered.includes('api_key') ||
            lowered.includes('authorization') ||
            lowered === 'token') {
            continue;
        }
        out[key] = scrubSensitive(child);
    }
    return out;
}
function firstTimestamp(events) {
    return events[0]?.timestamp;
}
function lastTerminalTimestamp(events) {
    for (let i = events.length - 1; i >= 0; i--) {
        if (['completed', 'failed', 'halted', 'human_required'].includes(events[i].event)) {
            return events[i].timestamp;
        }
    }
    return events[events.length - 1]?.timestamp;
}
function statusFromEvents(events) {
    const last = events[events.length - 1];
    if (!last) {
        return 'unknown';
    }
    if (last.event === 'completed') {
        return 'completed';
    }
    if (last.event === 'failed') {
        return 'failed';
    }
    if (last.event === 'halted') {
        return 'halted';
    }
    if (last.event === 'human_required') {
        return 'human_required';
    }
    return 'running';
}
/* -------------------------------------------------------------------------- */
/*  CS-3 — streaming run context cache (FS side)                              */
/* -------------------------------------------------------------------------- */
function runContextWindowsPath(workspaceRoot, runId) {
    return path.join(runDir(workspaceRoot, runId), exports.WORKFLOW_RUN_CONTEXT_FILE);
}
/** Read one run's windows in append order. Malformed lines are skipped. */
async function readRunContextWindows(workspaceRoot, runId) {
    let text;
    try {
        text = await fs.promises.readFile(runContextWindowsPath(workspaceRoot, runId), 'utf8');
    }
    catch {
        return [];
    }
    const out = [];
    for (const line of text.split('\n')) {
        if (!line.trim()) {
            continue;
        }
        try {
            const w = JSON.parse(line);
            if (w.schema === contextSpine_1.RUN_CONTEXT_WINDOW_SCHEMA && w.run_id === runId) {
                out.push(w);
            }
        }
        catch { /* skip */ }
    }
    return out;
}
/**
 * Append one contiguous window to a run's context cache. Contiguity is
 * enforced against the last persisted window (seq 0 first, then +1) so a
 * later replay can trust the stream has no gaps. Returns ok:false with the
 * reason instead of throwing.
 */
async function appendRunContextWindow(workspaceRoot, window) {
    try {
        const existing = await readRunContextWindows(workspaceRoot, window.run_id);
        const lastSeq = existing.length === 0 ? undefined : existing[existing.length - 1].seq;
        const invalid = (0, contextSpine_1.validateRunContextWindow)(window, lastSeq);
        if (invalid) {
            return { ok: false, error: invalid };
        }
        const file = runContextWindowsPath(workspaceRoot, window.run_id);
        await fs.promises.mkdir(path.dirname(file), { recursive: true });
        await fs.promises.appendFile(file, JSON.stringify({ ...window, schema: contextSpine_1.RUN_CONTEXT_WINDOW_SCHEMA }) + '\n', 'utf8');
        return { ok: true };
    }
    catch (err) {
        return { ok: false, error: err.message };
    }
}
/**
 * CS-3 producer: cache a completed run as ONE whole-run context window (the
 * coarsest valid windowing — trivially contiguous). Gate outcomes become the
 * evidence refs the runner can attest to; claim/inbox/review evidence is
 * appended by orchestrator-side callers through the same append API. Returns
 * the append result; callers treat it as best-effort.
 */
async function appendWholeRunWindow(workspaceRoot, run) {
    const evidence = [];
    const failureTypes = new Set();
    for (const event of run.events) {
        if (event.failureType) {
            failureTypes.add(event.failureType);
        }
        for (const gate of event.gateResults ?? []) {
            evidence.push({
                kind: 'gate',
                ref: `${event.nodeId}:${gate.id ?? 'gate'}`,
                summary: gate.passed ? 'passed' : `failed${gate.failureType ? ` (${gate.failureType})` : ''}`,
            });
        }
    }
    const existing = await readRunContextWindows(workspaceRoot, run.runId);
    return appendRunContextWindow(workspaceRoot, {
        schema: contextSpine_1.RUN_CONTEXT_WINDOW_SCHEMA,
        run_id: run.runId,
        seq: existing.length === 0 ? 0 : existing[existing.length - 1].seq + 1,
        task_id: run.taskId,
        playbook_id: run.playbookId,
        failure_types: [...failureTypes].sort(),
        evidence,
        started_at: run.startedAt,
        ended_at: run.endedAt,
    });
}
/** Collect every run's windows (for cross-run queries). Best-effort. */
async function collectRunContextWindows(workspaceRoot) {
    const base = path.join(workspaceRoot, exports.WORKFLOW_RUNS_DIR);
    let entries;
    try {
        entries = await fs.promises.readdir(base, { withFileTypes: true });
    }
    catch {
        return [];
    }
    const out = [];
    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }
        out.push(...await readRunContextWindows(workspaceRoot, entry.name));
    }
    return out;
}
//# sourceMappingURL=runLedger.js.map