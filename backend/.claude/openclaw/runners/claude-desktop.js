"use strict";
/**
 * claude-desktop.ts — `runner-claude-desktop` adapter (Sprint 4 / WA-2, F5).
 *
 * Drives Claude Code through the **same Claude Agent SDK seam** as
 * `claude-code.ts`, but tuned for a desktop / long-lived host:
 *
 *  - **Session continuity** — a desktop session id is *assigned* by the
 *    runner (a stable `--session-id <uuid>`), not discovered from output, so
 *    the same conversation can be resumed across a desktop restart.
 *  - **Context detection** — distinguishes the three Claude Code surfaces
 *    (Desktop app, terminal CLI, VS Code extension) so the orchestrator can
 *    pick the right resume strategy and surface it in `doctor`.
 *  - **Restart-safe resume** — `resume()` re-attaches to a known session id
 *    via `--resume`; the id is persisted to disk so a follow-up survives a
 *    full host restart.
 *
 * It reuses the {@link ClaudeHeadlessTransport} from `./claude-code` rather
 * than re-implementing the subprocess plumbing — swapping that module to the
 * real Agent SDK upgrades this runner for free.
 *
 * @see docs/rfc/runner-bridge-contract.md §5.1, §3, §7
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.claudeDesktopRunner = exports.ClaudeDesktopRunner = exports.DesktopCliTransport = exports.DesktopSessionStore = void 0;
exports.detectHostContext = detectHostContext;
exports.buildDesktopCliArgs = buildDesktopCliArgs;
const fs_1 = require("fs");
const crypto = require("crypto");
const os = require("os");
const path = require("path");
const claude_code_1 = require("./claude-code");
/**
 * Detect which Claude Code surface this process is running under.
 *
 * Heuristics, in priority order:
 *  1. `AUTOCLAW_CLAUDE_CONTEXT` env var — an explicit override.
 *  2. `CLAUDE_DESKTOP` / `CLAUDECODE`-style markers the desktop app sets.
 *  3. `VSCODE_PID` / `TERM_PROGRAM=vscode` — the VS Code extension host.
 *  4. Fallback: `cli`.
 *
 * @param env - the environment to inspect; defaults to `process.env`.
 * @returns the detected host context.
 */
function detectHostContext(env = process.env) {
    const override = (env.AUTOCLAW_CLAUDE_CONTEXT ?? '').toLowerCase().trim();
    if (override === 'desktop' || override === 'cli' || override === 'vscode') {
        return override;
    }
    if ((env.CLAUDE_DESKTOP ?? '') !== '' ||
        (env.CLAUDE_APP ?? '') !== '' ||
        (env.CLAUDE_CODE_ENTRYPOINT ?? '').toLowerCase() === 'desktop') {
        return 'desktop';
    }
    if ((env.VSCODE_PID ?? '') !== '' || (env.TERM_PROGRAM ?? '') === 'vscode') {
        return 'vscode';
    }
    return 'cli';
}
/**
 * Persists desktop session ids so a conversation can be resumed across a
 * full desktop / extension-host restart. Stored under
 * `<workingDir>/.autoclaw/runners/claude-desktop-sessions.json`.
 */
class DesktopSessionStore {
    constructor(workingDir) {
        this.indexPath = path.join(workingDir, '.autoclaw', 'runners', 'claude-desktop-sessions.json');
    }
    /** Read the index, tolerating a missing or corrupt file. */
    async read() {
        try {
            const raw = await fs_1.promises.readFile(this.indexPath, 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && parsed.sessions) {
                return { sessions: parsed.sessions };
            }
        }
        catch {
            // Missing / corrupt — start fresh.
        }
        return { sessions: {} };
    }
    /** Persist the index. Best-effort: a write failure is swallowed. */
    async write(index) {
        try {
            await fs_1.promises.mkdir(path.dirname(this.indexPath), { recursive: true });
            await fs_1.promises.writeFile(this.indexPath, JSON.stringify(index, null, 2), 'utf8');
        }
        catch {
            // Best-effort persistence.
        }
    }
    /** Record (insert or update) a session, refreshing its activity time. */
    async upsert(record) {
        const index = await this.read();
        const existing = index.sessions[record.sessionId];
        index.sessions[record.sessionId] = {
            ...record,
            createdAt: existing?.createdAt ?? record.createdAt,
        };
        await this.write(index);
    }
    /** Look up a persisted session by id. */
    async get(sessionId) {
        const index = await this.read();
        return index.sessions[sessionId];
    }
    /** All persisted sessions, most-recent activity first. */
    async list() {
        const index = await this.read();
        return Object.values(index.sessions).sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
    }
}
exports.DesktopSessionStore = DesktopSessionStore;
/* -------------------------------------------------------------------------- */
/*  Capabilities                                                              */
/* -------------------------------------------------------------------------- */
/** Static capabilities of the Claude Desktop host (RFC §2). */
const CLAUDE_DESKTOP_CAPABILITIES = {
    resumableSessions: true,
    jsonStructuredOutput: true,
    mcpServers: true,
    browser: false,
    customAgents: true,
    toolTrustGranularity: 'categories',
};
/** Minimum acceptable `claude` major version. */
const MIN_MAJOR_VERSION = 1;
/** Last ~4 KB of stdout retained for debugging. */
const STDOUT_TAIL_BYTES = 4096;
/** The `claude` executable name. */
const CLAUDE_BIN = 'claude';
/**
 * Build the desktop `claude` CLI argument list.
 *
 * Differs from the base runner's `buildCliArgs` in one respect: a new
 * session is given a stable id up-front via `--session-id <uuid>` so it can
 * be resumed deterministically after a host restart, instead of waiting for
 * the host to mint one.
 */
function buildDesktopCliArgs(args) {
    const cli = ['--print', '--output-format', 'stream-json', '--verbose'];
    cli.push('--permission-mode', args.permissionMode);
    if (args.resumeSessionId) {
        cli.push('--resume', args.resumeSessionId);
    }
    else if (args.assignSessionId) {
        cli.push('--session-id', args.assignSessionId);
    }
    if (args.agentProfile) {
        cli.push('--agents', args.agentProfile);
    }
    if (args.trustDenyList && args.trustDenyList.length > 0) {
        cli.push('--disallowed-tools', args.trustDenyList.join(','));
    }
    cli.push(args.prompt);
    return cli;
}
/**
 * Default {@link DesktopTransport}: wraps the base {@link CliHeadlessTransport}
 * but injects `--session-id` for new sessions via an args rewrite.
 *
 * The base transport builds its own CLI args internally, so to assign a
 * session id this transport spawns `claude` itself using
 * {@link buildDesktopCliArgs}. It reuses the base transport only for
 * {@link version}.
 */
class DesktopCliTransport {
    constructor() {
        this.base = new claude_code_1.CliHeadlessTransport();
    }
    /** Resolve `claude --version`, or `null` when the binary is absent. */
    async version() {
        return this.base.version();
    }
    /** Spawn the headless desktop subprocess and collect its output. */
    async run(args) {
        // Lazily require child_process.spawn so this file has one import site.
        const { spawn } = await Promise.resolve().then(() => require('child_process'));
        const cliArgs = buildDesktopCliArgs(args);
        const softTimeout = args.timeoutMs ?? 600000;
        const hardTimeout = softTimeout * 2;
        return new Promise((resolve) => {
            let child;
            try {
                child = spawn(CLAUDE_BIN, cliArgs, {
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
                    events: parseStreamJsonLocal(stdout),
                    stdout,
                    stderr,
                    timedOut,
                    spawnError,
                });
            };
            child.on('error', (err) => finish(127, err.message));
            child.on('close', (code) => {
                finish(code ?? (timedOut ? 124 : 1));
            });
        });
    }
}
exports.DesktopCliTransport = DesktopCliTransport;
/** Local `stream-json` parser — one JSON object per line, non-JSON skipped. */
function parseStreamJsonLocal(stdout) {
    const events = [];
    for (const rawLine of stdout.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (line.length === 0 || (line[0] !== '{' && line[0] !== '[')) {
            continue;
        }
        try {
            const parsed = JSON.parse(line);
            const items = Array.isArray(parsed) ? parsed : [parsed];
            for (const item of items) {
                if (typeof item === 'object' &&
                    item !== null &&
                    typeof item.type === 'string') {
                    events.push(item);
                }
            }
        }
        catch {
            // Not a JSON line — skip.
        }
    }
    return events;
}
/**
 * `runner-claude-desktop` — Claude Code on a desktop host with session
 * continuity.
 *
 * Construct with the default {@link DesktopCliTransport}, or inject an
 * alternative (an Agent-SDK transport, or a mock for tests).
 */
class ClaudeDesktopRunner {
    constructor(transport = new DesktopCliTransport(), hostContext = detectHostContext()) {
        this.id = 'claude-desktop';
        this.capabilities = CLAUDE_DESKTOP_CAPABILITIES;
        /** In-flight subprocesses keyed by session id, for {@link cancel}. */
        this.inFlight = new Map();
        /** Bounded recent-error ring (most recent first). */
        this.recentErrors = [];
        this.transport = transport;
        this.hostContext = hostContext;
    }
    /* ----------------------------------------------------------------------- */
    /*  detect()                                                               */
    /* ----------------------------------------------------------------------- */
    /**
     * Probe whether Claude Desktop is usable: `claude --version` resolves and
     * an Anthropic credential is present. The detected host context is folded
     * into the version string so `doctor` shows it.
     */
    async detect() {
        const version = await this.transport.version();
        if (version === null) {
            return {
                found: false,
                reason: 'not_installed',
                hint: 'Claude Code not found on PATH. Install the desktop app or CLI so `claude --version` works.',
            };
        }
        if (!(0, claude_code_1.isVersionSupported)(version)) {
            return {
                found: false,
                reason: 'version_too_old',
                hint: `Claude Code ${version} is too old; v${MIN_MAJOR_VERSION}.x or newer is required.`,
            };
        }
        if (!(0, claude_code_1.hasAnthropicAuth)()) {
            return {
                found: false,
                reason: 'no_auth',
                hint: 'No Anthropic credential found. Set ANTHROPIC_API_KEY or run `claude login`.',
            };
        }
        return {
            found: true,
            version: `${version} [context=${this.hostContext}]`,
            path: CLAUDE_BIN,
        };
    }
    /* ----------------------------------------------------------------------- */
    /*  dispatch()                                                             */
    /* ----------------------------------------------------------------------- */
    /**
     * Run a prompt as work. A new session is assigned a stable id up-front
     * (`--session-id`) and recorded in the {@link DesktopSessionStore} so it
     * survives a desktop restart; a request that carries `sessionId` resumes
     * that thread instead.
     */
    async dispatch(opts) {
        const startedAt = Date.now();
        const permissionMode = (0, claude_code_1.trustToPermissionMode)(opts.trust);
        const resuming = typeof opts.sessionId === 'string' && opts.sessionId.length > 0;
        // For a brand-new session, mint the id ourselves for restart-safe resume.
        const assignedId = resuming ? undefined : crypto.randomUUID();
        const trackingKey = opts.sessionId ?? assignedId ?? `pending-${startedAt}`;
        let outcome;
        try {
            outcome = await this.transport.run({
                prompt: opts.prompt,
                workingDir: opts.workingDir,
                permissionMode,
                resumeSessionId: resuming ? opts.sessionId : undefined,
                assignSessionId: assignedId,
                env: opts.env,
                timeoutMs: opts.timeoutMs,
                trustDenyList: opts.trustDenyList,
                agentProfile: opts.agentProfile,
                onSpawn: (child) => {
                    this.inFlight.set(trackingKey, child);
                },
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return this.failure(opts.sessionId ?? trackingKey, 'internal', startedAt, message);
        }
        finally {
            this.inFlight.delete(trackingKey);
        }
        const result = this.toDispatchResult(opts, outcome, startedAt, assignedId);
        await this.persistSession(opts, result);
        return result;
    }
    /* ----------------------------------------------------------------------- */
    /*  resume()                                                               */
    /* ----------------------------------------------------------------------- */
    /**
     * Resume a desktop session by id. The session id is looked up in the
     * {@link DesktopSessionStore} first so a resume works even after a full
     * desktop / extension-host restart wiped the host's in-memory state.
     */
    async resume(sessionId, prompt, opts) {
        const workingDir = opts?.workingDir ?? process.cwd();
        // Best-effort: confirm the session is known on disk. A missing record is
        // not fatal — the host may still hold the thread — but it is logged via
        // the activity refresh below once the dispatch lands.
        await new DesktopSessionStore(workingDir).get(sessionId);
        return this.dispatch({
            prompt,
            sessionId,
            trust: opts?.trust ?? 'auto',
            trustAllowList: opts?.trustAllowList,
            trustDenyList: opts?.trustDenyList,
            agentProfile: opts?.agentProfile,
            requireMcp: opts?.requireMcp,
            workingDir,
            env: opts?.env,
            timeoutMs: opts?.timeoutMs,
            scope: opts?.scope,
        });
    }
    /* ----------------------------------------------------------------------- */
    /*  listSessions()                                                         */
    /* ----------------------------------------------------------------------- */
    /**
     * List desktop sessions. Merges the runner's restart-safe store (rooted at
     * the current working directory) with the host's on-disk transcript store
     * under `~/.claude/projects/`.
     */
    async listSessions() {
        const summaries = [];
        const seen = new Set();
        // 1. The runner's own restart-safe store.
        try {
            const store = new DesktopSessionStore(process.cwd());
            for (const rec of await store.list()) {
                seen.add(rec.sessionId);
                summaries.push({
                    sessionId: rec.sessionId,
                    createdAt: rec.createdAt,
                    lastActivityAt: rec.lastActivityAt,
                    status: 'idle',
                    promptPreview: rec.promptPreview,
                });
            }
        }
        catch {
            // Store unreadable — fall through to the host transcript store.
        }
        // 2. The host's transcript store.
        const projectsDir = path.join(os.homedir(), '.claude', 'projects');
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
                if (seen.has(sessionId)) {
                    continue;
                }
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
        const authPresent = (0, claude_code_1.hasAnthropicAuth)();
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
            cliVersion: version !== null ? `${version} [context=${this.hostContext}]` : 'not_installed',
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
    /**
     * Convert a transport outcome into a {@link DispatchResult}. The session id
     * is resolved with desktop priority: the host-reported id (from the
     * `system` event) wins, then the id this runner assigned, then any resumed
     * id — so a restart-safe id is always present.
     */
    toDispatchResult(opts, outcome, startedAt, assignedId) {
        const finishedAt = new Date().toISOString();
        const durationMs = Date.now() - startedAt;
        this.lastDispatchAt = finishedAt;
        const sessionId = (0, claude_code_1.extractSessionId)(outcome.events) ?? assignedId ?? opts.sessionId ?? '';
        const resultEvent = outcome.events.find((e) => e.type === 'result');
        const stdoutTail = tail(outcome.stdout || outcome.stderr, STDOUT_TAIL_BYTES);
        if (outcome.spawnError !== undefined) {
            this.recordError('internal');
            return {
                ok: false,
                sessionId,
                exitCode: outcome.exitCode,
                finishedAt,
                durationMs,
                errorClass: 'internal',
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
            const errorClass = (0, claude_code_1.classifyError)(outcome);
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
     * Persist the session id to the {@link DesktopSessionStore} so a follow-up
     * survives a host restart. Best-effort — never masks the dispatch outcome.
     */
    async persistSession(opts, result) {
        if (result.sessionId === '') {
            return;
        }
        try {
            const store = new DesktopSessionStore(opts.workingDir);
            const now = new Date().toISOString();
            await store.upsert({
                sessionId: result.sessionId,
                context: this.hostContext,
                createdAt: now,
                lastActivityAt: now,
                promptPreview: opts.prompt.split(/\r?\n/)[0]?.slice(0, 120),
            });
        }
        catch {
            // Best-effort persistence.
        }
    }
}
exports.ClaudeDesktopRunner = ClaudeDesktopRunner;
/* -------------------------------------------------------------------------- */
/*  Free helpers                                                              */
/* -------------------------------------------------------------------------- */
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
/** Convenience singleton — registered with the {@link import('./registry').RunnerRegistry}. */
exports.claudeDesktopRunner = new ClaudeDesktopRunner();
//# sourceMappingURL=claude-desktop.js.map