"use strict";
/**
 * loop-service-adapter.ts — generic `LoopServiceAdapter` (Sprint 4 / WA-2, F4).
 *
 * A {@link Runner} adapter over an arbitrary HTTP "loop service": any
 * long-lived endpoint that accepts a prompt, runs an autonomous agent loop,
 * and exposes a poll-able status. Unlike CLI runners it is configured
 * entirely by data — endpoint, auth scheme, and the dispatch/poll path
 * shape — so a single class can drive AutoGPT, a homemade BabyAGI loop, or
 * any other HTTP agent runtime without a bespoke adapter.
 *
 * Config comes from a {@link LoopServiceConfig}; the `loop_services[]` array
 * in `config.yaml` is an array of these (see {@link parseLoopServicesConfig}).
 *
 * Heartbeat: loop services that are alive write a heartbeat JSON into
 * `.autoclaw/orchestrator/comms/heartbeats/` on every successful detect and
 * dispatch poll, so the orchestrator's fleet view sees them like any agent.
 *
 * Uses the Node 18+ global `fetch`; no third-party HTTP client.
 *
 * @see docs/rfc/runner-bridge-contract.md §2, §3, §7
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoopServiceAdapter = exports.LOOP_SERVICE_AUTONOMY = void 0;
exports.loopServiceAutonomy = loopServiceAutonomy;
exports.parseLoopServicesConfig = parseLoopServicesConfig;
exports.loopServiceRunnersFromConfig = loopServiceRunnersFromConfig;
exports.loopServiceErrorClass = loopServiceErrorClass;
exports.classifyLoopState = classifyLoopState;
const fs_1 = require("fs");
const path = require("path");
/** Conservative capability default for a generic HTTP loop service. */
const DEFAULT_CAPABILITIES = {
    resumableSessions: true,
    jsonStructuredOutput: true,
    mcpServers: false,
    browser: false,
    customAgents: false,
    toolTrustGranularity: 'all-or-nothing',
};
/** Default poll interval and poll ceiling. */
const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_POLL_CEILING_MS = 600000;
const STDOUT_TAIL_BYTES = 4096;
/**
 * Loop services are commonly trusted at the service level, not per-tool, so
 * the AutoClaw preset maps onto a coarse `autonomy` string in the body.
 */
exports.LOOP_SERVICE_AUTONOMY = {
    off: 'manual',
    auto: 'assisted',
    turbo: 'autonomous',
};
/** Translate an AutoClaw {@link TrustPreset} into the loop-service autonomy value. */
function loopServiceAutonomy(preset) {
    return exports.LOOP_SERVICE_AUTONOMY[preset] ?? exports.LOOP_SERVICE_AUTONOMY.off;
}
/**
 * Parse a `loop_services` value (the `loop_services[]` array from
 * `config.yaml`, already deserialized into a JS value) into validated
 * {@link LoopServiceConfig} entries. Malformed entries are dropped rather
 * than throwing, so one bad row never breaks the whole fleet.
 *
 * @param raw - the deserialized `loop_services` value, expected to be an array.
 * @returns the well-formed loop-service configs.
 */
function parseLoopServicesConfig(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    const out = [];
    for (const entry of raw) {
        if (typeof entry !== 'object' ||
            entry === null ||
            typeof entry.id !== 'string' ||
            typeof entry.endpoint !== 'string') {
            continue;
        }
        const e = entry;
        out.push({
            id: e.id,
            endpoint: e.endpoint,
            auth: isPlainObject(e.auth) ? e.auth : undefined,
            routes: isPlainObject(e.routes)
                ? e.routes
                : undefined,
            pollIntervalMs: typeof e.pollIntervalMs === 'number' ? e.pollIntervalMs : undefined,
            capabilities: isPlainObject(e.capabilities)
                ? e.capabilities
                : undefined,
            idField: typeof e.idField === 'string' ? e.idField : undefined,
        });
    }
    return out;
}
/** Build a {@link LoopServiceAdapter} for each entry in a `loop_services` config. */
function loopServiceRunnersFromConfig(raw) {
    return parseLoopServicesConfig(raw).map((cfg) => new LoopServiceAdapter(cfg));
}
/* -------------------------------------------------------------------------- */
/*  Internal helpers                                                          */
/* -------------------------------------------------------------------------- */
/** Whether a value is a non-null, non-array object. */
function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/** Sleep helper for the status-poll loop. */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/** Return the last `maxBytes` characters of `text`. */
function tail(text, maxBytes) {
    return text.length <= maxBytes ? text : text.slice(text.length - maxBytes);
}
/** Map a loop-service `error_class`/`state` onto a normalized {@link ErrorClass}. */
function loopServiceErrorClass(body) {
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
/** Classify a raw loop-service state string into a coarse terminal state. */
function classifyLoopState(state) {
    switch ((state ?? '').toLowerCase()) {
        case 'completed':
        case 'succeeded':
        case 'success':
        case 'done':
        case 'finished':
            return 'ok';
        case 'failed':
        case 'error':
        case 'errored':
        case 'cancelled':
        case 'canceled':
            return 'failed';
        default:
            return 'pending';
    }
}
/** Map a raw loop-service state string to a {@link SessionSummary} status. */
function mapSessionStatus(state) {
    switch (classifyLoopState(state)) {
        case 'ok':
            return 'completed';
        case 'failed':
            return 'failed';
        default:
            return (state ?? '').toLowerCase() === 'idle' ? 'idle' : 'active';
    }
}
/* -------------------------------------------------------------------------- */
/*  LoopServiceAdapter                                                        */
/* -------------------------------------------------------------------------- */
/**
 * Generic {@link Runner} adapter over a configurable HTTP loop service.
 *
 * One instance drives exactly one loop service; construct it from a
 * {@link LoopServiceConfig}. AutoGPT-specific behavior lives in the
 * `autogpt.ts` subclass.
 */
class LoopServiceAdapter {
    constructor(config) {
        this.recentErrors = new Map();
        this.config = config;
        this.id = config.id;
        this.capabilities = { ...DEFAULT_CAPABILITIES, ...(config.capabilities ?? {}) };
        this.provider = config.provider;
    }
    /* ----------------------------------------------------------------------- */
    /*  Route + auth resolution                                                */
    /* ----------------------------------------------------------------------- */
    /** Base endpoint with any trailing slashes trimmed. */
    baseEndpoint() {
        return this.config.endpoint.trim().replace(/\/+$/, '');
    }
    /** Resolve a route path against the configured overrides + defaults. */
    route(name) {
        const defaults = {
            health: '/health',
            dispatch: '/run',
            status: '/run/{id}',
            cancel: '/run/{id}',
            list: '/runs',
        };
        const configured = this.config.routes?.[name];
        const pathPart = configured ?? defaults[name];
        return `${this.baseEndpoint()}${pathPart.startsWith('/') ? '' : '/'}${pathPart}`;
    }
    /** Substitute `{id}` in a resolved route URL. */
    withId(url, id) {
        return url.replace('{id}', encodeURIComponent(id));
    }
    /**
     * Build the auth headers for the configured scheme. Returns an empty
     * object when auth is `none` or the named env var is unset.
     */
    authHeaders() {
        const auth = this.config.auth;
        if (!auth || auth.kind === 'none') {
            return {};
        }
        const token = auth.tokenEnv ? process.env[auth.tokenEnv] : undefined;
        if (!token || token.trim() === '') {
            return {};
        }
        if (auth.kind === 'bearer') {
            return { Authorization: `Bearer ${token.trim()}` };
        }
        // kind === 'header'
        return { [auth.headerName ?? 'Authorization']: token.trim() };
    }
    /** Whether the configured auth scheme expects a token that is actually present. */
    authConfigured() {
        const auth = this.config.auth;
        if (!auth || auth.kind === 'none') {
            return true;
        }
        const token = auth.tokenEnv ? process.env[auth.tokenEnv] : undefined;
        return Boolean(token && token.trim() !== '');
    }
    /* ----------------------------------------------------------------------- */
    /*  detect()                                                               */
    /* ----------------------------------------------------------------------- */
    /** Probe the loop service with an HTTP health check. */
    async detect() {
        if (this.baseEndpoint() === '') {
            return {
                found: false,
                reason: 'not_installed',
                hint: `Loop service "${this.id}" has no endpoint configured.`,
            };
        }
        if (!this.authConfigured()) {
            return {
                found: false,
                reason: 'no_auth',
                hint: `Loop service "${this.id}" needs ${this.config.auth?.tokenEnv} set.`,
            };
        }
        let res;
        try {
            res = await fetch(this.route('health'), {
                method: 'GET',
                headers: this.authHeaders(),
                signal: AbortSignal.timeout(10000),
            });
        }
        catch (err) {
            return {
                found: false,
                reason: 'not_installed',
                hint: `Loop service "${this.id}" health check failed: ${err instanceof Error ? err.message : String(err)}`,
            };
        }
        if (res.status === 401 || res.status === 403) {
            return {
                found: false,
                reason: 'no_auth',
                hint: `Loop service "${this.id}" rejected the request (HTTP ${res.status}).`,
            };
        }
        if (!res.ok) {
            return {
                found: false,
                reason: 'not_installed',
                hint: `Loop service "${this.id}" health endpoint returned HTTP ${res.status}.`,
            };
        }
        let version = 'unknown';
        try {
            const body = (await res.json());
            if (typeof body.version === 'string') {
                version = body.version;
            }
        }
        catch {
            // Non-JSON health body is acceptable.
        }
        await this.writeHeartbeat('idle');
        return { found: true, version, path: this.baseEndpoint() };
    }
    /* ----------------------------------------------------------------------- */
    /*  dispatch()                                                             */
    /* ----------------------------------------------------------------------- */
    /**
     * Submit a prompt to the loop service and poll its status route until it
     * reaches a terminal state.
     */
    async dispatch(opts) {
        const startedAt = Date.now();
        this.rememberHeartbeatRoot(opts.workingDir);
        if (this.baseEndpoint() === '') {
            return this.fail(startedAt, opts.sessionId, 'internal', -1);
        }
        if (!this.authConfigured()) {
            return this.fail(startedAt, opts.sessionId, 'auth', -1);
        }
        // ---- Submit ------------------------------------------------------------
        let dispatchId;
        try {
            const submitRes = await fetch(this.route('dispatch'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
                body: JSON.stringify(await this.composeDispatchBody(opts)),
                signal: AbortSignal.timeout(30000),
            });
            if (submitRes.status === 401 || submitRes.status === 403) {
                return this.fail(startedAt, opts.sessionId, 'auth', submitRes.status);
            }
            if (!submitRes.ok) {
                return this.fail(startedAt, opts.sessionId, 'internal', submitRes.status);
            }
            const submitBody = (await submitRes.json());
            const idField = this.config.idField ?? 'id';
            const id = submitBody[idField];
            if (typeof id !== 'string' && typeof id !== 'number') {
                return this.fail(startedAt, opts.sessionId, 'internal', -1);
            }
            dispatchId = String(id);
        }
        catch (err) {
            const cls = err instanceof Error && err.name === 'TimeoutError' ? 'timeout' : 'internal';
            return this.fail(startedAt, opts.sessionId, cls, -1);
        }
        await this.writeHeartbeat('busy', dispatchId);
        // ---- Poll --------------------------------------------------------------
        const ceiling = opts.timeoutMs && opts.timeoutMs > 0 ? opts.timeoutMs * 2 : DEFAULT_POLL_CEILING_MS;
        const interval = this.config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
        const statusUrl = this.withId(this.route('status'), dispatchId);
        while (Date.now() - startedAt < ceiling) {
            let body;
            try {
                const res = await fetch(statusUrl, {
                    method: 'GET',
                    headers: this.authHeaders(),
                    signal: AbortSignal.timeout(15000),
                });
                if (!res.ok) {
                    await delay(interval);
                    continue;
                }
                body = (await res.json());
            }
            catch {
                await delay(interval);
                continue;
            }
            await this.writeHeartbeat('busy', dispatchId);
            const terminal = classifyLoopState(body.state ?? body.status);
            if (terminal === 'ok') {
                await this.writeHeartbeat('idle', dispatchId);
                return this.finishOk(startedAt, dispatchId, body);
            }
            if (terminal === 'failed') {
                await this.writeHeartbeat('idle', dispatchId);
                return this.finishFailed(startedAt, dispatchId, body);
            }
            await delay(interval);
        }
        await this.writeHeartbeat('idle', dispatchId);
        return this.fail(startedAt, dispatchId, 'timeout', -1);
    }
    /**
     * Build the JSON body of the dispatch (submit) request. Subclasses (e.g.
     * AutoGPT) override this to match a vendor-specific request schema.
     */
    buildDispatchBody(opts) {
        return {
            prompt: opts.prompt,
            autonomy: loopServiceAutonomy(opts.trust),
            session_id: opts.sessionId,
            working_dir: opts.workingDir,
            agent_profile: opts.agentProfile,
            trust_allow_list: opts.trustAllowList,
            trust_deny_list: opts.trustDenyList,
            env: opts.env,
        };
    }
    /**
     * Async wrapper around `buildDispatchBody` that runs the optional
     * `augmentDispatchBody` hook. Subclasses needing async augmentation
     * (e.g. asking a provider for a plan preamble) override
     * `augmentDispatchBody`; subclasses with sync vendor-specific bodies
     * keep overriding `buildDispatchBody` and never touch this.
     *
     * Added in Phase B S3 to let `LocalCoderRunner` inject a plan
     * without changing the existing override surface. Existing
     * subclasses (AutoGpt, etc.) are unaffected — they override the
     * sync `buildDispatchBody` and the default `augmentDispatchBody` is
     * identity.
     */
    async composeDispatchBody(opts) {
        const base = this.buildDispatchBody(opts);
        return this.augmentDispatchBody(base, opts);
    }
    /**
     * Hook for async augmentation of the dispatch body. Default returns
     * the body unchanged. `LocalCoderRunner` overrides this to inject a
     * `preamble` from its LLM provider.
     */
    augmentDispatchBody(body, _opts) {
        return Promise.resolve(body);
    }
    /** Visible for testing — returns the provider injected via config. */
    providerForTest() {
        return this.provider;
    }
    /* ----------------------------------------------------------------------- */
    /*  resume()                                                               */
    /* ----------------------------------------------------------------------- */
    /** Resume an existing loop-service run by carrying its id forward. */
    async resume(sessionId, prompt, opts) {
        return this.dispatch({
            prompt,
            trust: opts?.trust ?? 'auto',
            workingDir: opts?.workingDir ?? process.cwd(),
            ...opts,
            sessionId,
        });
    }
    /* ----------------------------------------------------------------------- */
    /*  listSessions()                                                         */
    /* ----------------------------------------------------------------------- */
    /** List runs known to the loop service via its list route. */
    async listSessions() {
        if (this.baseEndpoint() === '') {
            return [];
        }
        try {
            const res = await fetch(this.route('list'), {
                method: 'GET',
                headers: this.authHeaders(),
                signal: AbortSignal.timeout(15000),
            });
            if (!res.ok) {
                return [];
            }
            const body = (await res.json());
            const runs = Array.isArray(body) ? body : (body.runs ?? body.tasks ?? []);
            return runs.map((r) => ({
                sessionId: r.id ?? 'unknown',
                createdAt: r.created_at ?? new Date(0).toISOString(),
                lastActivityAt: r.updated_at,
                status: mapSessionStatus(r.state ?? r.status),
                promptPreview: r.prompt_preview,
            }));
        }
        catch {
            return [];
        }
    }
    /* ----------------------------------------------------------------------- */
    /*  health()                                                               */
    /* ----------------------------------------------------------------------- */
    /** Report runner health by re-probing the loop service endpoint. */
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
    /* ----------------------------------------------------------------------- */
    /*  cancel()                                                               */
    /* ----------------------------------------------------------------------- */
    /** Cancel an in-flight run via the loop service's cancel route (DELETE). */
    async cancel(sessionId) {
        if (this.baseEndpoint() === '') {
            return;
        }
        try {
            await fetch(this.withId(this.route('cancel'), sessionId), {
                method: 'DELETE',
                headers: this.authHeaders(),
                signal: AbortSignal.timeout(15000),
            });
        }
        catch {
            // Cancellation is best-effort.
        }
    }
    /* ----------------------------------------------------------------------- */
    /*  Result builders                                                        */
    /* ----------------------------------------------------------------------- */
    /** Build a successful {@link DispatchResult} from a terminal status body. */
    finishOk(startedAt, dispatchId, body) {
        const finishedAt = new Date().toISOString();
        this.lastDispatchAt = finishedAt;
        return {
            ok: true,
            sessionId: body.id ?? dispatchId,
            exitCode: body.exit_code ?? 0,
            finishedAt,
            durationMs: Date.now() - startedAt,
            tokens: body.tokens && typeof body.tokens.input === 'number'
                ? { input: body.tokens.input ?? 0, output: body.tokens.output ?? 0 }
                : undefined,
            rationale: typeof body.result === 'string' ? body.result : undefined,
            stdoutTail: tail(body.output ?? body.result ?? '', STDOUT_TAIL_BYTES),
        };
    }
    /** Build a failed {@link DispatchResult} from a terminal status body. */
    finishFailed(startedAt, dispatchId, body) {
        const errorClass = loopServiceErrorClass(body);
        this.recordError(errorClass);
        const finishedAt = new Date().toISOString();
        this.lastDispatchAt = finishedAt;
        return {
            ok: false,
            sessionId: body.id ?? dispatchId,
            exitCode: body.exit_code ?? -1,
            finishedAt,
            durationMs: Date.now() - startedAt,
            errorClass,
            stdoutTail: tail(body.error ?? body.output ?? '', STDOUT_TAIL_BYTES),
        };
    }
    /** Build a failed {@link DispatchResult} for a pre/in-poll transport error. */
    fail(startedAt, sessionId, errorClass, exitCode) {
        this.recordError(errorClass);
        const finishedAt = new Date().toISOString();
        this.lastDispatchAt = finishedAt;
        return {
            ok: false,
            sessionId: sessionId ?? `${this.id}-${Date.now()}`,
            exitCode,
            finishedAt,
            durationMs: Date.now() - startedAt,
            errorClass,
        };
    }
    /** Append an error to the recent-error tally surfaced by {@link health}. */
    recordError(cls) {
        this.recentErrors.set(cls, (this.recentErrors.get(cls) ?? 0) + 1);
    }
    /* ----------------------------------------------------------------------- */
    /*  Heartbeats                                                             */
    /* ----------------------------------------------------------------------- */
    /**
     * Remember which workspace's heartbeats directory to write to. The
     * orchestrator passes the workspace as {@link DispatchOptions.workingDir};
     * once known it is retained for all later heartbeats.
     */
    rememberHeartbeatRoot(workingDir) {
        if (workingDir && this.heartbeatRoot === undefined) {
            this.heartbeatRoot = path.join(workingDir, '.autoclaw', 'orchestrator', 'comms', 'heartbeats');
        }
    }
    /**
     * Write a heartbeat JSON for this loop service into
     * `.autoclaw/orchestrator/comms/heartbeats/<id>.json`. Best-effort: a
     * write failure never affects the dispatch outcome. No-op until a working
     * directory has been observed via {@link dispatch}.
     */
    async writeHeartbeat(status, sessionId) {
        const root = this.heartbeatRoot;
        if (root === undefined) {
            return;
        }
        try {
            await fs_1.promises.mkdir(root, { recursive: true });
            const payload = {
                agent: this.id,
                kind: 'loop_service',
                status,
                sessionId: sessionId ?? null,
                endpoint: this.baseEndpoint(),
                ts: new Date().toISOString(),
            };
            await fs_1.promises.writeFile(path.join(root, `${this.id}.json`), JSON.stringify(payload, null, 2), 'utf8');
        }
        catch {
            // Best-effort heartbeat — never let it fail a dispatch.
        }
    }
}
exports.LoopServiceAdapter = LoopServiceAdapter;
//# sourceMappingURL=loop-service-adapter.js.map