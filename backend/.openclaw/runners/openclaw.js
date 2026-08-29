"use strict";
/**
 * openclaw.ts — `runner-openclaw` adapter (Sprint 2 / WA-4 task F3).
 *
 * OpenClaw is a hybrid host: it ships a CLI (`openclaw`) and, when
 * configured, an HTTP endpoint. This adapter prefers whichever surface is
 * available, in this order:
 *
 *   1. `OPENCLAW_ENDPOINT` set + reachable → REST mode.
 *   2. `openclaw` CLI on PATH                → CLI mode.
 *
 * - `detect()`   — CLI `openclaw --version`, or endpoint health.
 * - `dispatch()` — `openclaw submit --manifest <file>` (CLI) or `POST /jobs` (REST).
 * - Task IDs     — OpenClaw mints its own job IDs; this adapter keeps a
 *                  bidirectional map between OpenClaw job IDs and AutoClaw
 *                  sprint task IDs (carried as `sessionId`).
 *
 * NO direct LLM calls — OpenClaw is the agent host.
 *
 * @see docs/rfc/runner-bridge-contract.md §2, §3, §7
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.openclawRunner = exports.OpenClawRunner = exports.OPENCLAW_TRUST = void 0;
exports.openclawTrust = openclawTrust;
exports.openclawTrustFlags = openclawTrustFlags;
const child_process_1 = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
/* -------------------------------------------------------------------------- */
/*  Trust translation                                                         */
/* -------------------------------------------------------------------------- */
/**
 * OpenClaw exposes a `--trust` flag (CLI) / `trust` field (REST) with three
 * levels that line up 1:1 with the AutoClaw presets.
 */
exports.OPENCLAW_TRUST = {
    off: 'gated',
    auto: 'supervised',
    turbo: 'unattended',
};
/** Translate an AutoClaw {@link TrustPreset} into the OpenClaw trust level. */
function openclawTrust(preset) {
    return exports.OPENCLAW_TRUST[preset] ?? exports.OPENCLAW_TRUST.off;
}
/** OpenClaw CLI trust flag fragment. */
function openclawTrustFlags(preset) {
    return ['--trust', openclawTrust(preset)];
}
/* -------------------------------------------------------------------------- */
/*  Internal helpers                                                          */
/* -------------------------------------------------------------------------- */
/** OpenClaw CLI binary; overridable via `AUTOCLAW_OPENCLAW_BIN` for tests. */
const OPENCLAW_BIN = process.env.AUTOCLAW_OPENCLAW_BIN ?? 'openclaw';
const STDOUT_TAIL_BYTES = 4096;
const POLL_INTERVAL_MS = 2000;
const DEFAULT_POLL_CEILING_MS = 600000;
/** Resolve the OpenClaw REST endpoint, trimming a trailing slash. */
function openclawEndpoint() {
    const raw = process.env.OPENCLAW_ENDPOINT;
    if (!raw || raw.trim() === '') {
        return null;
    }
    return raw.trim().replace(/\/+$/, '');
}
/** Auth header block, present only when `OPENCLAW_TOKEN` is configured. */
function authHeaders() {
    const token = process.env.OPENCLAW_TOKEN;
    return token ? { Authorization: `Bearer ${token}` } : {};
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/** Run `openclaw --version`; resolves null if the binary is absent. */
function probeOpenclawVersion() {
    return new Promise((resolve) => {
        (0, child_process_1.execFile)(OPENCLAW_BIN, ['--version'], { timeout: 10000 }, (err, stdout) => {
            resolve(err ? null : { version: stdout.trim() || 'unknown' });
        });
    });
}
/** Resolve the absolute path of the openclaw executable, best-effort. */
function probeOpenclawPath() {
    return new Promise((resolve) => {
        const which = process.platform === 'win32' ? 'where' : 'which';
        (0, child_process_1.execFile)(which, [OPENCLAW_BIN], { timeout: 10000 }, (err, stdout) => {
            resolve(err ? OPENCLAW_BIN : stdout.split(/\r?\n/)[0].trim() || OPENCLAW_BIN);
        });
    });
}
/** Map an OpenClaw CLI exit code / stderr to a normalized {@link ErrorClass}. */
function openclawExitToErrorClass(exitCode, stderr) {
    const lc = stderr.toLowerCase();
    if (lc.includes('auth') || lc.includes('token') || lc.includes('401')) {
        return 'auth';
    }
    if (lc.includes('trust') || lc.includes('denied') || lc.includes('not permitted')) {
        return 'tool_denied';
    }
    if (lc.includes('mcp')) {
        return 'mcp_startup';
    }
    if (exitCode === 124) {
        return 'timeout';
    }
    return 'internal';
}
/* -------------------------------------------------------------------------- */
/*  OpenClawRunner                                                            */
/* -------------------------------------------------------------------------- */
/**
 * {@link Runner} adapter for OpenClaw — a hybrid CLI/REST agent host.
 *
 * Maintains a bidirectional map between OpenClaw job IDs and AutoClaw
 * sprint task IDs so the orchestrator can resume / cancel by either key.
 */
class OpenClawRunner {
    constructor() {
        this.id = 'openclaw';
        this.capabilities = {
            resumableSessions: true,
            jsonStructuredOutput: true,
            mcpServers: true,
            browser: false,
            customAgents: true,
            toolTrustGranularity: 'categories',
        };
        /** AutoClaw sprint task id → OpenClaw job id. */
        this.taskToJob = new Map();
        /** OpenClaw job id → AutoClaw sprint task id. */
        this.jobToTask = new Map();
        this.recentErrors = new Map();
    }
    /**
     * Record the OpenClaw ↔ AutoClaw task-id correspondence so later
     * `resume`/`cancel` calls can translate in either direction.
     */
    linkIds(autoclawTaskId, openclawJobId) {
        this.taskToJob.set(autoclawTaskId, openclawJobId);
        this.jobToTask.set(openclawJobId, autoclawTaskId);
    }
    /** Translate an AutoClaw sprint task id to its OpenClaw job id, if known. */
    resolveJobId(autoclawTaskId) {
        return this.taskToJob.get(autoclawTaskId);
    }
    /** Translate an OpenClaw job id back to its AutoClaw sprint task id, if known. */
    resolveTaskId(openclawJobId) {
        return this.jobToTask.get(openclawJobId);
    }
    /**
     * Probe whether OpenClaw is usable: REST endpoint first, then CLI.
     */
    async detect() {
        const endpoint = openclawEndpoint();
        if (endpoint !== null) {
            try {
                const res = await fetch(`${endpoint}/health`, {
                    method: 'GET',
                    headers: authHeaders(),
                    signal: AbortSignal.timeout(10000),
                });
                if (res.status === 401 || res.status === 403) {
                    return {
                        found: false,
                        reason: 'no_auth',
                        hint: 'OpenClaw endpoint rejected the request (401/403). Set a valid OPENCLAW_TOKEN.',
                    };
                }
                if (res.ok) {
                    let version = 'unknown';
                    try {
                        const body = (await res.json());
                        if (typeof body.version === 'string') {
                            version = body.version;
                        }
                    }
                    catch {
                        /* non-JSON health body acceptable */
                    }
                    return { found: true, version, path: endpoint };
                }
            }
            catch {
                // Endpoint configured but unreachable — fall through to CLI probe.
            }
        }
        const probe = await probeOpenclawVersion();
        if (probe === null) {
            return {
                found: false,
                reason: 'not_installed',
                hint: endpoint !== null
                    ? `OpenClaw endpoint ${endpoint} unreachable and \`${OPENCLAW_BIN}\` CLI not found.`
                    : `OpenClaw CLI not found. Install it and ensure \`${OPENCLAW_BIN}\` is on PATH, or set OPENCLAW_ENDPOINT.`,
            };
        }
        const cliPath = await probeOpenclawPath();
        return { found: true, version: probe.version, path: cliPath };
    }
    /**
     * Submit work to OpenClaw. Uses the REST endpoint when configured,
     * otherwise `openclaw submit --manifest <file>`.
     */
    async dispatch(opts) {
        const startedAt = Date.now();
        const autoclawTaskId = opts.sessionId ?? `openclaw-${crypto.randomUUID()}`;
        const endpoint = openclawEndpoint();
        if (endpoint !== null) {
            return await this.dispatchRest(endpoint, autoclawTaskId, opts, startedAt);
        }
        return await this.dispatchCli(autoclawTaskId, opts, startedAt);
    }
    /* ---- REST dispatch ----------------------------------------------------- */
    async dispatchRest(endpoint, autoclawTaskId, opts, startedAt) {
        let jobId;
        try {
            const submitRes = await fetch(`${endpoint}/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    prompt: opts.prompt,
                    trust: openclawTrust(opts.trust),
                    working_dir: opts.workingDir,
                    autoclaw_task_id: autoclawTaskId,
                    agent_profile: opts.agentProfile,
                    trust_allow_list: opts.trustAllowList,
                    trust_deny_list: opts.trustDenyList,
                    require_mcp: opts.requireMcp,
                    env: opts.env,
                }),
                signal: AbortSignal.timeout(30000),
            });
            if (submitRes.status === 401 || submitRes.status === 403) {
                return this.fail(startedAt, autoclawTaskId, 'auth', submitRes.status);
            }
            if (!submitRes.ok) {
                return this.fail(startedAt, autoclawTaskId, 'internal', submitRes.status);
            }
            const body = (await submitRes.json());
            const id = body.job_id ?? body.id;
            if (!id) {
                return this.fail(startedAt, autoclawTaskId, 'internal', -1);
            }
            jobId = id;
        }
        catch (err) {
            const cls = err instanceof Error && err.name === 'TimeoutError' ? 'timeout' : 'internal';
            return this.fail(startedAt, autoclawTaskId, cls, -1);
        }
        this.linkIds(autoclawTaskId, jobId);
        const ceiling = opts.timeoutMs && opts.timeoutMs > 0 ? opts.timeoutMs * 2 : DEFAULT_POLL_CEILING_MS;
        while (Date.now() - startedAt < ceiling) {
            let body;
            try {
                const res = await fetch(`${endpoint}/jobs/${encodeURIComponent(jobId)}`, {
                    method: 'GET',
                    headers: authHeaders(),
                    signal: AbortSignal.timeout(15000),
                });
                if (!res.ok) {
                    await delay(POLL_INTERVAL_MS);
                    continue;
                }
                body = (await res.json());
            }
            catch {
                await delay(POLL_INTERVAL_MS);
                continue;
            }
            const state = (body.state ?? '').toLowerCase();
            if (state === 'completed' || state === 'succeeded' || state === 'done') {
                const finishedAt = new Date();
                this.lastDispatchAt = finishedAt.toISOString();
                return {
                    ok: true,
                    sessionId: autoclawTaskId,
                    exitCode: body.exit_code ?? 0,
                    finishedAt: finishedAt.toISOString(),
                    durationMs: Date.now() - startedAt,
                    stdoutTail: (body.output ?? '').slice(-STDOUT_TAIL_BYTES),
                };
            }
            if (state === 'failed' || state === 'error' || state === 'cancelled') {
                const errorClass = mapOpenclawErrorClass(body.error_class);
                return this.fail(startedAt, autoclawTaskId, errorClass, body.exit_code ?? -1, (body.error ?? body.output ?? '').slice(-STDOUT_TAIL_BYTES));
            }
            await delay(POLL_INTERVAL_MS);
        }
        return this.fail(startedAt, autoclawTaskId, 'timeout', -1);
    }
    /* ---- CLI dispatch ------------------------------------------------------ */
    async dispatchCli(autoclawTaskId, opts, startedAt) {
        // Write a manifest file describing the job, then `openclaw submit --manifest`.
        const manifestPath = path.join(os.tmpdir(), `autoclaw-openclaw-${autoclawTaskId.replace(/[^\w.-]/g, '_')}.json`);
        const manifest = {
            autoclaw_task_id: autoclawTaskId,
            prompt: opts.prompt,
            trust: openclawTrust(opts.trust),
            working_dir: opts.workingDir,
            agent_profile: opts.agentProfile,
            trust_allow_list: opts.trustAllowList,
            trust_deny_list: opts.trustDenyList,
            require_mcp: opts.requireMcp ?? false,
        };
        try {
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        }
        catch {
            return this.fail(startedAt, autoclawTaskId, 'internal', -1);
        }
        const args = [
            'submit',
            '--manifest',
            manifestPath,
            ...openclawTrustFlags(opts.trust),
        ];
        return await new Promise((resolve) => {
            const child = (0, child_process_1.spawn)(OPENCLAW_BIN, args, {
                cwd: opts.workingDir,
                env: { ...process.env, ...(opts.env ?? {}) },
            });
            let stdout = '';
            let stderr = '';
            let settled = false;
            const timeoutMs = opts.timeoutMs;
            const killTimer = timeoutMs && timeoutMs > 0
                ? setTimeout(() => child.kill('SIGKILL'), timeoutMs * 2)
                : null;
            let timedOut = false;
            const softTimer = timeoutMs && timeoutMs > 0
                ? setTimeout(() => {
                    timedOut = true;
                }, timeoutMs)
                : null;
            const cleanupManifest = () => {
                try {
                    fs.unlinkSync(manifestPath);
                }
                catch {
                    /* best-effort */
                }
            };
            const finish = (exitCode, errorClass) => {
                if (settled) {
                    return;
                }
                settled = true;
                if (killTimer) {
                    clearTimeout(killTimer);
                }
                if (softTimer) {
                    clearTimeout(softTimer);
                }
                cleanupManifest();
                // OpenClaw CLI prints the minted job id on the first stdout line as
                // `job: <id>` — capture it for the id map when present.
                const jobMatch = stdout.match(/job[:\s]+([\w-]+)/i);
                if (jobMatch) {
                    this.linkIds(autoclawTaskId, jobMatch[1]);
                }
                const finishedAt = new Date();
                this.lastDispatchAt = finishedAt.toISOString();
                const ok = exitCode === 0 && errorClass === undefined;
                if (!ok && errorClass) {
                    this.recentErrors.set(errorClass, (this.recentErrors.get(errorClass) ?? 0) + 1);
                }
                resolve({
                    ok,
                    sessionId: autoclawTaskId,
                    exitCode,
                    finishedAt: finishedAt.toISOString(),
                    durationMs: Date.now() - startedAt,
                    errorClass,
                    stdoutTail: stdout.slice(-STDOUT_TAIL_BYTES),
                });
            };
            child.stdout.on('data', (chunk) => {
                stdout += chunk.toString('utf8');
                if (stdout.length > STDOUT_TAIL_BYTES * 4) {
                    stdout = stdout.slice(-STDOUT_TAIL_BYTES * 2);
                }
            });
            child.stderr.on('data', (chunk) => {
                stderr += chunk.toString('utf8');
            });
            child.on('error', () => finish(-1, 'internal'));
            child.on('close', (code) => {
                const exitCode = code ?? -1;
                if (timedOut) {
                    finish(exitCode, 'timeout');
                    return;
                }
                if (exitCode === 0) {
                    finish(0);
                    return;
                }
                finish(exitCode, openclawExitToErrorClass(exitCode, stderr));
            });
        });
    }
    /** Build a failed {@link DispatchResult} and record the error class. */
    fail(startedAt, sessionId, errorClass, exitCode, stdoutTail) {
        this.recentErrors.set(errorClass, (this.recentErrors.get(errorClass) ?? 0) + 1);
        const finishedAt = new Date();
        this.lastDispatchAt = finishedAt.toISOString();
        return {
            ok: false,
            sessionId,
            exitCode,
            finishedAt: finishedAt.toISOString(),
            durationMs: Date.now() - startedAt,
            errorClass,
            stdoutTail,
        };
    }
    /** Resume an OpenClaw job, carrying the AutoClaw task id forward. */
    async resume(sessionId, prompt, opts) {
        return await this.dispatch({
            prompt,
            trust: opts?.trust ?? 'auto',
            workingDir: opts?.workingDir ?? process.cwd(),
            sessionId,
            ...opts,
        });
    }
    /** List OpenClaw jobs (REST mode) or the locally-mapped jobs (CLI mode). */
    async listSessions() {
        const endpoint = openclawEndpoint();
        if (endpoint !== null) {
            try {
                const res = await fetch(`${endpoint}/jobs`, {
                    method: 'GET',
                    headers: authHeaders(),
                    signal: AbortSignal.timeout(15000),
                });
                if (res.ok) {
                    const body = (await res.json());
                    const jobs = Array.isArray(body) ? body : (body.jobs ?? []);
                    return jobs.map((j) => ({
                        sessionId: this.jobToTask.get(j.job_id ?? '') ?? j.job_id ?? 'unknown',
                        createdAt: j.created_at ?? new Date(0).toISOString(),
                        lastActivityAt: j.updated_at,
                        status: mapOpenclawState(j.state),
                        promptPreview: j.prompt_preview,
                    }));
                }
            }
            catch {
                // Fall through to local map.
            }
        }
        // CLI mode: report what the id map knows.
        return [...this.taskToJob.keys()].map((taskId) => ({
            sessionId: taskId,
            createdAt: new Date(0).toISOString(),
            status: 'idle',
        }));
    }
    /** Report runner health by re-probing OpenClaw. */
    async health() {
        const detection = await this.detect();
        const recentErrors = [...this.recentErrors.entries()].map(([cls, count]) => ({
            class: cls,
            count,
        }));
        return {
            ok: detection.found,
            authPresent: !(detection.found === false && detection.reason === 'no_auth'),
            cliVersion: detection.found ? detection.version : 'not_found',
            mcpServersConfigured: this.capabilities.mcpServers ? 1 : 0,
            lastDispatchAt: this.lastDispatchAt,
            recentErrors,
        };
    }
    /** Cancel an OpenClaw job, accepting either an AutoClaw task id or job id. */
    async cancel(sessionId) {
        const endpoint = openclawEndpoint();
        if (endpoint === null) {
            return;
        }
        // Accept either id form.
        const jobId = this.taskToJob.get(sessionId) ?? sessionId;
        try {
            await fetch(`${endpoint}/jobs/${encodeURIComponent(jobId)}`, {
                method: 'DELETE',
                headers: authHeaders(),
                signal: AbortSignal.timeout(15000),
            });
        }
        catch {
            // Best-effort; the orchestrator will time the job out.
        }
    }
}
exports.OpenClawRunner = OpenClawRunner;
/** Map a raw OpenClaw `error_class` string to a normalized {@link ErrorClass}. */
function mapOpenclawErrorClass(raw) {
    switch ((raw ?? '').toLowerCase()) {
        case 'auth':
        case 'unauthorized':
            return 'auth';
        case 'timeout':
            return 'timeout';
        case 'tool_denied':
        case 'permission_denied':
            return 'tool_denied';
        case 'mcp_startup':
        case 'mcp':
            return 'mcp_startup';
        default:
            return 'internal';
    }
}
/** Map a raw OpenClaw job state to a {@link SessionSummary} status. */
function mapOpenclawState(state) {
    switch ((state ?? '').toLowerCase()) {
        case 'completed':
        case 'succeeded':
        case 'done':
            return 'completed';
        case 'failed':
        case 'error':
        case 'cancelled':
            return 'failed';
        case 'running':
        case 'pending':
        case 'queued':
            return 'active';
        default:
            return 'idle';
    }
}
/** Convenience singleton — registered with the {@link import('./registry').RunnerRegistry}. */
exports.openclawRunner = new OpenClawRunner();
//# sourceMappingURL=openclaw.js.map