"use strict";
/**
 * hermes.ts — `runner-hermes` adapter (Sprint 2 / WA-4 task F2).
 *
 * Drives a Hermes task service over REST. Unlike CLI runners, Hermes is a
 * long-lived HTTP endpoint:
 *
 * - `detect()`       — HTTP health check on `HERMES_ENDPOINT`.
 * - `dispatch()`     — `POST /tasks`, then poll `GET /tasks/{id}/status`.
 * - `capabilities`   — refreshed from `GET /capabilities` on detect.
 *
 * Uses the Node 18+ global `fetch`; no third-party HTTP client.
 *
 * NO direct LLM calls — the Hermes service is the agent host; this adapter
 * only submits tasks and polls their status.
 *
 * @see docs/rfc/runner-bridge-contract.md §2, §3, §7
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hermesRunner = exports.HermesRunner = exports.HERMES_AUTONOMY = void 0;
exports.hermesAutonomy = hermesAutonomy;
const crypto = require("crypto");
/* -------------------------------------------------------------------------- */
/*  Trust translation                                                         */
/* -------------------------------------------------------------------------- */
/**
 * Hermes accepts a trust policy in the `POST /tasks` body rather than as
 * CLI flags. This maps the AutoClaw preset onto Hermes' `autonomy` field.
 */
exports.HERMES_AUTONOMY = {
    off: 'manual',
    auto: 'assisted',
    turbo: 'autonomous',
};
/** Translate an AutoClaw {@link TrustPreset} into the Hermes `autonomy` value. */
function hermesAutonomy(preset) {
    return exports.HERMES_AUTONOMY[preset] ?? exports.HERMES_AUTONOMY.off;
}
/* -------------------------------------------------------------------------- */
/*  Internal helpers                                                          */
/* -------------------------------------------------------------------------- */
/** Resolve the Hermes endpoint from env, trimming any trailing slash. */
function hermesEndpoint() {
    const raw = process.env.HERMES_ENDPOINT;
    if (!raw || raw.trim() === '') {
        return null;
    }
    return raw.trim().replace(/\/+$/, '');
}
/** Hermes status-poll interval and ceiling. */
const POLL_INTERVAL_MS = 2000;
const DEFAULT_POLL_CEILING_MS = 600000; // 10 min if no timeout supplied.
const STDOUT_TAIL_BYTES = 4096;
/** Sleep helper for the status-poll loop. */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/** Auth header block, present only when `HERMES_TOKEN` is configured. */
function authHeaders() {
    const token = process.env.HERMES_TOKEN;
    return token ? { Authorization: `Bearer ${token}` } : {};
}
/** Map a Hermes `error_class`/`state` to a normalized {@link ErrorClass}. */
function hermesErrorClass(body) {
    const ec = (body.error_class ?? '').toLowerCase();
    if (ec === 'auth' || ec === 'unauthorized') {
        return 'auth';
    }
    if (ec === 'timeout') {
        return 'timeout';
    }
    if (ec === 'tool_denied' || ec === 'permission_denied') {
        return 'tool_denied';
    }
    if (ec === 'mcp_startup' || ec === 'mcp') {
        return 'mcp_startup';
    }
    return 'internal';
}
/* -------------------------------------------------------------------------- */
/*  HermesRunner                                                              */
/* -------------------------------------------------------------------------- */
/**
 * {@link Runner} adapter for the Hermes REST task service.
 *
 * Capability advertisement is dynamic: {@link detect} refreshes
 * {@link HermesRunner.capabilities} from `GET /capabilities`. Until detect
 * runs, a conservative default is reported.
 */
class HermesRunner {
    constructor() {
        this.id = 'hermes';
        /** Mutable: refreshed from `GET /capabilities` during {@link detect}. */
        this.capabilities = {
            resumableSessions: true,
            jsonStructuredOutput: true,
            mcpServers: false,
            browser: false,
            customAgents: true,
            toolTrustGranularity: 'categories',
        };
        this.recentErrors = new Map();
    }
    /**
     * Probe whether the Hermes service is reachable and advertise its
     * capabilities. The endpoint comes from `HERMES_ENDPOINT`.
     */
    async detect() {
        const endpoint = hermesEndpoint();
        if (endpoint === null) {
            return {
                found: false,
                reason: 'not_installed',
                hint: 'HERMES_ENDPOINT is not set. Point it at a running Hermes service, e.g. http://localhost:8080.',
            };
        }
        let healthRes;
        try {
            healthRes = await fetch(`${endpoint}/health`, {
                method: 'GET',
                headers: authHeaders(),
                signal: AbortSignal.timeout(10000),
            });
        }
        catch (err) {
            return {
                found: false,
                reason: 'not_installed',
                hint: `Hermes health check failed at ${endpoint}/health: ${err instanceof Error ? err.message : String(err)}`,
            };
        }
        if (healthRes.status === 401 || healthRes.status === 403) {
            return {
                found: false,
                reason: 'no_auth',
                hint: 'Hermes rejected the request (401/403). Set a valid HERMES_TOKEN.',
            };
        }
        if (!healthRes.ok) {
            return {
                found: false,
                reason: 'not_installed',
                hint: `Hermes health endpoint returned HTTP ${healthRes.status} at ${endpoint}/health.`,
            };
        }
        let version = 'unknown';
        try {
            const body = (await healthRes.json());
            if (typeof body.version === 'string') {
                version = body.version;
            }
        }
        catch {
            // Non-JSON health body is acceptable; keep version 'unknown'.
        }
        // Best-effort capability refresh — failures here do not fail detection.
        await this.refreshCapabilities(endpoint);
        return { found: true, version, path: endpoint };
    }
    /** Refresh {@link capabilities} from `GET /capabilities`; tolerant of failure. */
    async refreshCapabilities(endpoint) {
        try {
            const res = await fetch(`${endpoint}/capabilities`, {
                method: 'GET',
                headers: authHeaders(),
                signal: AbortSignal.timeout(10000),
            });
            if (!res.ok) {
                return;
            }
            const adv = (await res.json());
            this.capabilities = {
                resumableSessions: adv.resumableSessions ?? this.capabilities.resumableSessions,
                jsonStructuredOutput: adv.jsonStructuredOutput ?? this.capabilities.jsonStructuredOutput,
                mcpServers: adv.mcpServers ?? this.capabilities.mcpServers,
                browser: adv.browser ?? this.capabilities.browser,
                customAgents: adv.customAgents ?? this.capabilities.customAgents,
                toolTrustGranularity: adv.toolTrustGranularity ?? this.capabilities.toolTrustGranularity,
            };
        }
        catch {
            // Capability advertisement is best-effort.
        }
    }
    /**
     * Submit a task to Hermes (`POST /tasks`) and poll `GET /tasks/{id}/status`
     * until the task reaches a terminal state.
     */
    async dispatch(opts) {
        const startedAt = Date.now();
        const endpoint = hermesEndpoint();
        if (endpoint === null) {
            return this.failFast(startedAt, opts.sessionId, 'auth', -1);
        }
        // ---- Submit -----------------------------------------------------------
        let taskId;
        try {
            const submitRes = await fetch(`${endpoint}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    prompt: opts.prompt,
                    autonomy: hermesAutonomy(opts.trust),
                    working_dir: opts.workingDir,
                    session_id: opts.sessionId,
                    agent_profile: opts.agentProfile,
                    trust_allow_list: opts.trustAllowList,
                    trust_deny_list: opts.trustDenyList,
                    env: opts.env,
                }),
                signal: AbortSignal.timeout(30000),
            });
            if (submitRes.status === 401 || submitRes.status === 403) {
                return this.failFast(startedAt, opts.sessionId, 'auth', submitRes.status);
            }
            if (!submitRes.ok) {
                return this.failFast(startedAt, opts.sessionId, 'internal', submitRes.status);
            }
            const submitBody = (await submitRes.json());
            if (!submitBody.id) {
                return this.failFast(startedAt, opts.sessionId, 'internal', -1);
            }
            taskId = submitBody.id;
        }
        catch (err) {
            const cls = err instanceof Error && err.name === 'TimeoutError' ? 'timeout' : 'internal';
            return this.failFast(startedAt, opts.sessionId, cls, -1);
        }
        // ---- Poll -------------------------------------------------------------
        const ceiling = opts.timeoutMs && opts.timeoutMs > 0 ? opts.timeoutMs * 2 : DEFAULT_POLL_CEILING_MS;
        while (Date.now() - startedAt < ceiling) {
            let body;
            try {
                const res = await fetch(`${endpoint}/tasks/${encodeURIComponent(taskId)}/status`, {
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
                return this.finishOk(startedAt, taskId, body);
            }
            if (state === 'failed' || state === 'error' || state === 'cancelled') {
                return this.finishFailed(startedAt, taskId, body);
            }
            // pending / running / queued — keep polling.
            await delay(POLL_INTERVAL_MS);
        }
        // Poll ceiling exceeded.
        return this.failFast(startedAt, taskId, 'timeout', -1);
    }
    /** Build a successful {@link DispatchResult} from a terminal Hermes status. */
    finishOk(startedAt, taskId, body) {
        const finishedAt = new Date();
        this.lastDispatchAt = finishedAt.toISOString();
        return {
            ok: true,
            sessionId: body.id ?? taskId,
            exitCode: body.exit_code ?? 0,
            finishedAt: finishedAt.toISOString(),
            durationMs: Date.now() - startedAt,
            tokens: body.tokens && typeof body.tokens.input === 'number'
                ? { input: body.tokens.input ?? 0, output: body.tokens.output ?? 0 }
                : undefined,
            stdoutTail: (body.output ?? '').slice(-STDOUT_TAIL_BYTES),
        };
    }
    /** Build a failed {@link DispatchResult} from a terminal Hermes status. */
    finishFailed(startedAt, taskId, body) {
        const errorClass = hermesErrorClass(body);
        this.recentErrors.set(errorClass, (this.recentErrors.get(errorClass) ?? 0) + 1);
        const finishedAt = new Date();
        this.lastDispatchAt = finishedAt.toISOString();
        return {
            ok: false,
            sessionId: body.id ?? taskId,
            exitCode: body.exit_code ?? -1,
            finishedAt: finishedAt.toISOString(),
            durationMs: Date.now() - startedAt,
            errorClass,
            stdoutTail: (body.error ?? body.output ?? '').slice(-STDOUT_TAIL_BYTES),
        };
    }
    /** Build a failed {@link DispatchResult} for a pre-poll / transport error. */
    failFast(startedAt, sessionId, errorClass, exitCode) {
        this.recentErrors.set(errorClass, (this.recentErrors.get(errorClass) ?? 0) + 1);
        const finishedAt = new Date();
        this.lastDispatchAt = finishedAt.toISOString();
        return {
            ok: false,
            sessionId: sessionId ?? `hermes-${crypto.randomUUID()}`,
            exitCode,
            finishedAt: finishedAt.toISOString(),
            durationMs: Date.now() - startedAt,
            errorClass,
        };
    }
    /** Resume an existing Hermes task by passing its id forward. */
    async resume(sessionId, prompt, opts) {
        return await this.dispatch({
            prompt,
            trust: opts?.trust ?? 'auto',
            workingDir: opts?.workingDir ?? process.cwd(),
            sessionId,
            ...opts,
        });
    }
    /** List tasks known to the Hermes service via `GET /tasks`. */
    async listSessions() {
        const endpoint = hermesEndpoint();
        if (endpoint === null) {
            return [];
        }
        try {
            const res = await fetch(`${endpoint}/tasks`, {
                method: 'GET',
                headers: authHeaders(),
                signal: AbortSignal.timeout(15000),
            });
            if (!res.ok) {
                return [];
            }
            const body = (await res.json());
            const tasks = Array.isArray(body) ? body : (body.tasks ?? []);
            return tasks.map((t) => ({
                sessionId: t.id ?? 'unknown',
                createdAt: t.created_at ?? new Date(0).toISOString(),
                lastActivityAt: t.updated_at,
                status: mapHermesState(t.state),
                promptPreview: t.prompt_preview,
            }));
        }
        catch {
            return [];
        }
    }
    /** Report runner health by re-probing the Hermes endpoint. */
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
    /** Cancel an in-flight Hermes task via `DELETE /tasks/{id}`. */
    async cancel(sessionId) {
        const endpoint = hermesEndpoint();
        if (endpoint === null) {
            return;
        }
        try {
            await fetch(`${endpoint}/tasks/${encodeURIComponent(sessionId)}`, {
                method: 'DELETE',
                headers: authHeaders(),
                signal: AbortSignal.timeout(15000),
            });
        }
        catch {
            // Cancellation is best-effort; the orchestrator will time the task out.
        }
    }
}
exports.HermesRunner = HermesRunner;
/** Map a raw Hermes task state string to a {@link SessionSummary} status. */
function mapHermesState(state) {
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
exports.hermesRunner = new HermesRunner();
//# sourceMappingURL=hermes.js.map