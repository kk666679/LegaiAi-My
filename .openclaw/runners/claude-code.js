"use strict";
/**
 * `runner-claude-code` — drives Claude Code as a headless subprocess.
 *
 * Implements the {@link Runner} contract (RFC §2) for the Claude Code host.
 * RFC §5.1 specifies a Claude Agent SDK headless subprocess; the
 * `@anthropic-ai/claude-agent-sdk` / `@anthropic-ai/sdk` packages are not
 * currently dependencies of this extension, so this module spawns the
 * `claude` CLI in headless print mode (`--print --output-format
 * stream-json`) via `child_process` against a thin typed interface.
 *
 * // TODO: swap to Claude Agent SDK when dependency approved — the
 * //       {@link ClaudeHeadlessTransport} indirection keeps that change
 * //       local to this file.
 *
 * @see docs/rfc/runner-bridge-contract.md §5.1, §3, §7
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeCodeRunner = exports.CliHeadlessTransport = void 0;
exports.trustToPermissionMode = trustToPermissionMode;
exports.buildCliArgs = buildCliArgs;
exports.parseStreamJson = parseStreamJson;
exports.hasAnthropicAuth = hasAnthropicAuth;
exports.isVersionSupported = isVersionSupported;
exports.extractSessionId = extractSessionId;
exports.classifyError = classifyError;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const os = require("os");
const path = require("path");
const registry_1 = require("./registry");
/** RFC §3 trust-preset → Claude Code `permissionMode` mapping. */
const PERMISSION_MODE_BY_PRESET = {
    off: 'default',
    auto: 'acceptEdits',
    turbo: 'bypassPermissions',
};
/**
 * Translate an AutoClaw {@link TrustPreset} into a Claude Code
 * `permissionMode`.
 *
 * The {@link translateTrust} table in `./registry` is the authoritative
 * RFC §3 source; this function reuses it (the `claude-code` row stores its
 * values as `permissionMode: <mode>` descriptor strings) and falls back to
 * the local {@link PERMISSION_MODE_BY_PRESET} map if the table row is
 * missing or shaped unexpectedly.
 *
 * @param preset - the requested trust preset.
 * @returns the equivalent Claude Code permission mode.
 */
function trustToPermissionMode(preset) {
    const translation = (0, registry_1.translateTrust)('claude-code', preset);
    for (const flag of translation.flags) {
        const match = /^permissionMode:\s*(default|acceptEdits|bypassPermissions)$/.exec(flag);
        if (match) {
            return match[1];
        }
    }
    return PERMISSION_MODE_BY_PRESET[preset];
}
/* -------------------------------------------------------------------------- */
/*  CLI-backed transport (default)                                            */
/* -------------------------------------------------------------------------- */
/** Default soft timeout when a dispatch does not request one (10 min). */
const DEFAULT_TIMEOUT_MS = 600000;
/** The `claude` executable name; resolved from `$PATH`. */
const CLAUDE_BIN = 'claude';
/**
 * {@link ClaudeHeadlessTransport} implementation that spawns the `claude`
 * CLI in headless print mode and parses its `stream-json` output.
 *
 * // TODO: swap to Claude Agent SDK when dependency approved.
 */
class CliHeadlessTransport {
    /** Resolve `claude --version`, or `null` when the binary is absent. */
    async version() {
        return new Promise((resolve) => {
            (0, child_process_1.execFile)(CLAUDE_BIN, ['--version'], { timeout: 10000, windowsHide: true }, (err, stdout) => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(stdout.trim() || 'unknown');
            });
        });
    }
    /** Spawn the headless subprocess and collect its structured output. */
    async run(args) {
        const cliArgs = buildCliArgs(args);
        const softTimeout = args.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        const hardTimeout = softTimeout * 2;
        return new Promise((resolve) => {
            let child;
            try {
                child = (0, child_process_1.spawn)(CLAUDE_BIN, cliArgs, {
                    cwd: args.workingDir,
                    env: { ...process.env, ...(args.env ?? {}) },
                    windowsHide: true,
                    stdio: ['ignore', 'pipe', 'pipe'],
                });
            }
            catch (err) {
                resolve({
                    exitCode: 127,
                    events: [],
                    stdout: '',
                    stderr: '',
                    timedOut: false,
                    spawnError: err instanceof Error ? err.message : String(err),
                });
                return;
            }
            args.onSpawn?.(child);
            let stdout = '';
            let stderr = '';
            let timedOut = false;
            let settled = false;
            const watchdog = setTimeout(() => {
                timedOut = true;
                child.kill('SIGKILL');
            }, hardTimeout);
            child.stdout?.on('data', (chunk) => {
                stdout += chunk.toString('utf8');
            });
            child.stderr?.on('data', (chunk) => {
                stderr += chunk.toString('utf8');
            });
            const finish = (exitCode, spawnError) => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(watchdog);
                resolve({
                    exitCode,
                    events: parseStreamJson(stdout),
                    stdout,
                    stderr,
                    timedOut,
                    spawnError,
                });
            };
            child.on('error', (err) => {
                finish(127, err.message);
            });
            child.on('close', (code) => {
                finish(code ?? (timedOut ? 124 : 1));
            });
        });
    }
}
exports.CliHeadlessTransport = CliHeadlessTransport;
/**
 * Build the `claude` CLI argument list for a headless run.
 *
 * Headless mode = `--print` (non-interactive) with
 * `--output-format stream-json` so tool-call events are machine-readable.
 *
 * @param args - the run inputs.
 * @returns the ordered CLI argument list.
 */
function buildCliArgs(args) {
    const cli = ['--print', '--output-format', 'stream-json', '--verbose'];
    cli.push('--permission-mode', args.permissionMode);
    if (args.resumeSessionId) {
        cli.push('--resume', args.resumeSessionId);
    }
    if (args.agentProfile) {
        cli.push('--agents', args.agentProfile);
    }
    if (args.trustDenyList && args.trustDenyList.length > 0) {
        cli.push('--disallowed-tools', args.trustDenyList.join(','));
    }
    // Prompt is the final positional argument — the initial user message.
    cli.push(args.prompt);
    return cli;
}
/**
 * Parse a Claude CLI `stream-json` stdout blob into structured events.
 *
 * `stream-json` emits one JSON object per line; non-JSON lines (banners,
 * warnings) are skipped rather than failing the parse.
 *
 * @param stdout - raw subprocess stdout.
 * @returns the parsed events, in arrival order.
 */
function parseStreamJson(stdout) {
    const events = [];
    for (const rawLine of stdout.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (line.length === 0 || (line[0] !== '{' && line[0] !== '[')) {
            continue;
        }
        try {
            const parsed = JSON.parse(line);
            if (Array.isArray(parsed)) {
                for (const item of parsed) {
                    if (isStreamEvent(item)) {
                        events.push(item);
                    }
                }
            }
            else if (isStreamEvent(parsed)) {
                events.push(parsed);
            }
        }
        catch {
            // Not a JSON line — skip.
        }
    }
    return events;
}
/** Narrowing guard for an arbitrary parsed value to {@link ClaudeStreamEvent}. */
function isStreamEvent(value) {
    return (typeof value === 'object' &&
        value !== null &&
        typeof value.type === 'string');
}
/* -------------------------------------------------------------------------- */
/*  Runner implementation                                                     */
/* -------------------------------------------------------------------------- */
/** Static capabilities of the Claude Code host (RFC §2). */
const CLAUDE_CODE_CAPABILITIES = {
    resumableSessions: true,
    jsonStructuredOutput: true,
    mcpServers: true,
    browser: false,
    customAgents: true,
    toolTrustGranularity: 'categories',
};
/** Minimum acceptable `claude` CLI major version. */
const MIN_MAJOR_VERSION = 1;
/** Last ~4 KB of stdout is retained for debugging (RFC §2 `stdoutTail`). */
const STDOUT_TAIL_BYTES = 4096;
/**
 * The Claude Code runner.
 *
 * Construct with the default {@link CliHeadlessTransport}, or inject an
 * alternative transport (e.g. an SDK-backed one, or a mock for tests).
 */
class ClaudeCodeRunner {
    constructor(transport = new CliHeadlessTransport()) {
        this.id = 'claude-code';
        this.capabilities = CLAUDE_CODE_CAPABILITIES;
        /** In-flight subprocesses keyed by session id, for {@link cancel}. */
        this.inFlight = new Map();
        /** Bounded recent-error ring (most recent first), surfaced by {@link health}. */
        this.recentErrors = [];
        this.transport = transport;
    }
    /* ----------------------------------------------------------------------- */
    /*  detect()                                                               */
    /* ----------------------------------------------------------------------- */
    /**
     * Probe whether Claude Code is usable: `claude --version` resolves from
     * `$PATH` and an Anthropic credential is present (env or keychain).
     */
    async detect() {
        const version = await this.transport.version();
        if (version === null) {
            return {
                found: false,
                reason: 'not_installed',
                hint: 'Claude Code CLI not found on PATH. Install it and ensure `claude --version` works.',
            };
        }
        if (!isVersionSupported(version)) {
            return {
                found: false,
                reason: 'version_too_old',
                hint: `Claude Code CLI ${version} is too old; v${MIN_MAJOR_VERSION}.x or newer is required.`,
            };
        }
        if (!hasAnthropicAuth()) {
            return {
                found: false,
                reason: 'no_auth',
                hint: 'No Anthropic credential found. Set ANTHROPIC_API_KEY or run `claude login` to populate the keychain.',
            };
        }
        return { found: true, version, path: CLAUDE_BIN };
    }
    /* ----------------------------------------------------------------------- */
    /*  dispatch()                                                             */
    /* ----------------------------------------------------------------------- */
    /**
     * Run a prompt as work via a Claude Code headless subprocess. The final
     * result is serialized to `dispatch-result.json` next to the outbox
     * (`<workingDir>/.autoclaw/outbox/`).
     */
    async dispatch(opts) {
        const startedAt = Date.now();
        const permissionMode = trustToPermissionMode(opts.trust);
        let outcome;
        let trackedSessionId = opts.sessionId;
        try {
            outcome = await this.transport.run({
                prompt: opts.prompt,
                workingDir: opts.workingDir,
                permissionMode,
                resumeSessionId: opts.sessionId,
                env: opts.env,
                timeoutMs: opts.timeoutMs,
                trustDenyList: opts.trustDenyList,
                agentProfile: opts.agentProfile,
                onSpawn: (child) => {
                    // Register under the provided session id when resuming; the
                    // freshly created session id is not known until the `system`
                    // event arrives, so a new dispatch is tracked under a temporary
                    // key that `cancel` can still match on a best-effort basis.
                    const key = opts.sessionId ?? `pending-${startedAt}`;
                    trackedSessionId = key;
                    this.inFlight.set(key, child);
                },
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return this.failure(opts.sessionId ?? '', 'internal', startedAt, message);
        }
        finally {
            if (trackedSessionId !== undefined) {
                this.inFlight.delete(trackedSessionId);
            }
        }
        const result = this.toDispatchResult(opts, outcome, startedAt);
        // Re-key the in-flight map onto the real session id if one was learned.
        if (trackedSessionId !== undefined && trackedSessionId !== result.sessionId) {
            this.inFlight.delete(trackedSessionId);
        }
        await this.persistResult(opts.workingDir, result, outcome);
        return result;
    }
    /* ----------------------------------------------------------------------- */
    /*  resume()                                                               */
    /* ----------------------------------------------------------------------- */
    /**
     * Resume an existing Claude Code session with a follow-up prompt
     * (`claude --resume <sessionId>`).
     */
    async resume(sessionId, prompt, opts) {
        return this.dispatch({
            prompt,
            sessionId,
            trust: opts?.trust ?? 'auto',
            trustAllowList: opts?.trustAllowList,
            trustDenyList: opts?.trustDenyList,
            agentProfile: opts?.agentProfile,
            requireMcp: opts?.requireMcp,
            workingDir: opts?.workingDir ?? process.cwd(),
            env: opts?.env,
            timeoutMs: opts?.timeoutMs,
            scope: opts?.scope,
        });
    }
    /* ----------------------------------------------------------------------- */
    /*  listSessions()                                                         */
    /* ----------------------------------------------------------------------- */
    /**
     * List Claude Code sessions known on this machine, read from the
     * `~/.claude/projects/` session store.
     *
     * The CLI has no machine-readable `--list-sessions` output yet, so this
     * enumerates the on-disk session transcripts directly. Returns an empty
     * list when no store is present.
     */
    async listSessions() {
        const projectsDir = path.join(os.homedir(), '.claude', 'projects');
        const summaries = [];
        let projectDirs;
        try {
            projectDirs = await fs_1.promises.readdir(projectsDir);
        }
        catch {
            return summaries;
        }
        for (const project of projectDirs) {
            const projectPath = path.join(projectsDir, project);
            let files;
            try {
                files = await fs_1.promises.readdir(projectPath);
            }
            catch {
                continue;
            }
            for (const file of files) {
                if (!file.endsWith('.jsonl')) {
                    continue;
                }
                const sessionId = file.slice(0, -'.jsonl'.length);
                try {
                    const stat = await fs_1.promises.stat(path.join(projectPath, file));
                    summaries.push({
                        sessionId,
                        createdAt: stat.birthtime.toISOString(),
                        lastActivityAt: stat.mtime.toISOString(),
                        status: 'idle',
                    });
                }
                catch {
                    // Unreadable transcript — skip.
                }
            }
        }
        return summaries;
    }
    /* ----------------------------------------------------------------------- */
    /*  health()                                                               */
    /* ----------------------------------------------------------------------- */
    /** Report runner health (auth, version, MCP, recent errors) — RFC §7. */
    async health() {
        const version = await this.transport.version();
        const authPresent = hasAnthropicAuth();
        const mcpServersConfigured = await countMcpServers();
        const errorCounts = new Map();
        for (const rec of this.recentErrors) {
            errorCounts.set(rec.class, (errorCounts.get(rec.class) ?? 0) + 1);
        }
        const recentErrors = [...errorCounts.entries()].map(([cls, count]) => ({
            class: cls,
            count,
        }));
        return {
            ok: version !== null && authPresent,
            authPresent,
            cliVersion: version ?? 'not_installed',
            mcpServersConfigured,
            lastDispatchAt: this.lastDispatchAt,
            recentErrors,
        };
    }
    /* ----------------------------------------------------------------------- */
    /*  cancel()                                                               */
    /* ----------------------------------------------------------------------- */
    /** Cancel an in-flight session by killing its subprocess. */
    async cancel(sessionId) {
        const child = this.inFlight.get(sessionId);
        if (child) {
            child.kill('SIGTERM');
            this.inFlight.delete(sessionId);
        }
    }
    /* ----------------------------------------------------------------------- */
    /*  internals                                                              */
    /* ----------------------------------------------------------------------- */
    /** Convert a raw transport outcome into a {@link DispatchResult}. */
    toDispatchResult(opts, outcome, startedAt) {
        const finishedAt = new Date().toISOString();
        const durationMs = Date.now() - startedAt;
        this.lastDispatchAt = finishedAt;
        const sessionId = extractSessionId(outcome.events) ?? opts.sessionId ?? '';
        const resultEvent = outcome.events.find((e) => e.type === 'result');
        const stdoutTail = tail(outcome.stdout || outcome.stderr, STDOUT_TAIL_BYTES);
        if (outcome.spawnError !== undefined) {
            const errorClass = 'internal';
            this.recordError(errorClass);
            return {
                ok: false,
                sessionId,
                exitCode: outcome.exitCode,
                finishedAt,
                durationMs,
                errorClass,
                stdoutTail: tail(outcome.spawnError, STDOUT_TAIL_BYTES),
            };
        }
        if (outcome.timedOut) {
            this.recordError('timeout');
            return {
                ok: false,
                sessionId,
                exitCode: outcome.exitCode,
                finishedAt,
                durationMs,
                errorClass: 'timeout',
                stdoutTail,
            };
        }
        const isError = outcome.exitCode !== 0 ||
            resultEvent?.is_error === true ||
            (typeof resultEvent?.subtype === 'string' && resultEvent.subtype !== 'success');
        if (isError) {
            const errorClass = classifyError(outcome);
            this.recordError(errorClass);
            return {
                ok: false,
                sessionId,
                exitCode: outcome.exitCode,
                finishedAt,
                durationMs,
                tokens: extractTokens(resultEvent),
                errorClass,
                rationale: typeof resultEvent?.result === 'string' ? resultEvent.result : undefined,
                stdoutTail,
            };
        }
        return {
            ok: true,
            sessionId,
            exitCode: outcome.exitCode,
            finishedAt,
            durationMs,
            tokens: extractTokens(resultEvent),
            rationale: typeof resultEvent?.result === 'string' ? resultEvent.result : undefined,
            stdoutTail,
        };
    }
    /** Append an error to the bounded recent-error ring (cap 50). */
    recordError(cls) {
        this.recentErrors.unshift({ class: cls });
        if (this.recentErrors.length > 50) {
            this.recentErrors.length = 50;
        }
    }
    /** Build a {@link DispatchResult} for a pre-dispatch failure. */
    failure(sessionId, errorClass, startedAt, message) {
        this.recordError(errorClass);
        const finishedAt = new Date().toISOString();
        this.lastDispatchAt = finishedAt;
        return {
            ok: false,
            sessionId,
            exitCode: 1,
            finishedAt,
            durationMs: Date.now() - startedAt,
            errorClass,
            stdoutTail: tail(message, STDOUT_TAIL_BYTES),
        };
    }
    /**
     * Serialize the final result to `dispatch-result.json` next to the
     * outbox (`<workingDir>/.autoclaw/outbox/`). Best-effort: a write
     * failure is swallowed so it never masks the dispatch outcome.
     */
    async persistResult(workingDir, result, outcome) {
        try {
            const outboxDir = path.join(workingDir, '.autoclaw', 'outbox');
            await fs_1.promises.mkdir(outboxDir, { recursive: true });
            const payload = {
                runner: this.id,
                result,
                events: outcome.events,
            };
            await fs_1.promises.writeFile(path.join(outboxDir, 'dispatch-result.json'), JSON.stringify(payload, null, 2), 'utf8');
        }
        catch {
            // Best-effort persistence — never let it fail the dispatch.
        }
    }
}
exports.ClaudeCodeRunner = ClaudeCodeRunner;
/* -------------------------------------------------------------------------- */
/*  Free helpers                                                              */
/* -------------------------------------------------------------------------- */
/** Whether an Anthropic credential is present (env var or keychain file). */
function hasAnthropicAuth() {
    if (typeof process.env.ANTHROPIC_API_KEY === 'string' &&
        process.env.ANTHROPIC_API_KEY.trim().length > 0) {
        return true;
    }
    if (typeof process.env.CLAUDE_CODE_OAUTH_TOKEN === 'string' &&
        process.env.CLAUDE_CODE_OAUTH_TOKEN.trim().length > 0) {
        return true;
    }
    // Keychain presence: `claude login` writes credentials under ~/.claude.
    try {
        const credsPath = path.join(os.homedir(), '.claude', '.credentials.json');
        // eslint-disable-next-line no-sync
        require('fs').accessSync(credsPath);
        return true;
    }
    catch {
        return false;
    }
}
/** Whether a `claude --version` string meets the minimum supported major. */
function isVersionSupported(version) {
    const match = /(\d+)\.(\d+)\.(\d+)/.exec(version);
    if (!match) {
        // Unparseable version string — accept rather than block on a format change.
        return true;
    }
    return Number(match[1]) >= MIN_MAJOR_VERSION;
}
/** Pull the session id off the `system` init event, if present. */
function extractSessionId(events) {
    for (const event of events) {
        if (typeof event.session_id === 'string' && event.session_id.length > 0) {
            return event.session_id;
        }
    }
    return undefined;
}
/** Pull token usage off a `result` event, normalized to the contract shape. */
function extractTokens(resultEvent) {
    const usage = resultEvent?.usage;
    if (!usage) {
        return undefined;
    }
    return {
        input: typeof usage.input_tokens === 'number' ? usage.input_tokens : 0,
        output: typeof usage.output_tokens === 'number' ? usage.output_tokens : 0,
    };
}
/**
 * Map a failed run onto a normalized {@link ErrorClass} (RFC §7).
 *
 * Heuristics over exit code, the `result` event subtype, and stderr text.
 */
function classifyError(outcome) {
    const haystack = `${outcome.stderr}\n${outcome.stdout}`.toLowerCase();
    const resultEvent = outcome.events.find((e) => e.type === 'result');
    const subtype = typeof resultEvent?.subtype === 'string' ? resultEvent.subtype : '';
    if (/api[_ -]?key|unauthorized|authentication|invalid x-api-key|401|please run .claude login/.test(haystack)) {
        return 'auth';
    }
    if (/mcp|model context protocol/.test(haystack) && /fail|error|could not start/.test(haystack)) {
        return 'mcp_startup';
    }
    if (subtype.includes('permission') ||
        /permission denied|tool .* denied|not allowed to use/.test(haystack)) {
        return 'tool_denied';
    }
    if (outcome.timedOut || /timed out|timeout/.test(haystack)) {
        return 'timeout';
    }
    return 'internal';
}
/** Count MCP servers configured in user + workspace `settings.json`. */
async function countMcpServers() {
    const candidates = [
        path.join(os.homedir(), '.claude', 'settings.json'),
        path.join(process.cwd(), '.claude', 'settings.json'),
    ];
    let total = 0;
    for (const file of candidates) {
        try {
            const raw = await fs_1.promises.readFile(file, 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
                total += Object.keys(parsed.mcpServers).length;
            }
        }
        catch {
            // Missing or unparseable settings file — contributes 0.
        }
    }
    return total;
}
/** Return the last `maxBytes` characters of `text`. */
function tail(text, maxBytes) {
    return text.length <= maxBytes ? text : text.slice(text.length - maxBytes);
}
//# sourceMappingURL=claude-code.js.map