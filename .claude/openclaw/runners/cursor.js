"use strict";
/**
 * `runner-cursor` — Cursor adapter for the AutoClaw runner contract.
 *
 * Drives `cursor-agent --no-interactive` as a headless subprocess. Implements
 * the {@link Runner} interface from `./types`; the orchestrator only ever
 * speaks that contract.
 *
 * @see docs/rfc/runner-bridge-contract.md §5.2 (cursor), §7 (health / exit codes)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cursorRunner = exports.CursorRunner = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const registry_1 = require("./registry");
/** Host executable name. Resolved from `$PATH`. */
const CURSOR_BIN = 'cursor-agent';
/** Max bytes of stdout retained on {@link DispatchResult.stdoutTail}. */
const STDOUT_TAIL_BYTES = 4096;
/** Default soft time cap when {@link DispatchOptions.timeoutMs} is unset. */
const DEFAULT_TIMEOUT_MS = 600000;
/**
 * Map a `cursor-agent` process exit code to a normalized {@link ErrorClass}.
 *
 * `cursor-agent` does not (yet) publish a stable exit-code table, so the
 * mapping is conservative: only well-known POSIX-ish conventions are
 * recognized, everything else is `internal`.
 *
 * @param exitCode - the subprocess exit code (or `null` if killed by signal).
 * @param timedOut - whether the orchestrator's soft cap was exceeded.
 */
function classifyCursorExit(exitCode, timedOut) {
    if (timedOut) {
        return 'timeout';
    }
    switch (exitCode) {
        case 0:
            return undefined;
        case null:
            return 'internal'; // killed by signal
        case 2:
            return 'auth'; // cursor-agent: bad/missing credentials
        case 4:
            return 'tool_denied'; // cursor-agent: an approval was refused
        default:
            return 'internal';
    }
}
/** Keep only the trailing {@link STDOUT_TAIL_BYTES} of a captured buffer. */
function tail(text) {
    return text.length > STDOUT_TAIL_BYTES ? text.slice(-STDOUT_TAIL_BYTES) : text;
}
/**
 * Cursor runner. One instance is registered with the
 * {@link import('./registry').RunnerRegistry} at startup.
 */
class CursorRunner {
    constructor(opts = {}) {
        this.id = 'cursor';
        this.capabilities = {
            resumableSessions: true,
            jsonStructuredOutput: false,
            mcpServers: true,
            browser: false,
            customAgents: false,
            toolTrustGranularity: 'categories',
        };
        /** Rolling error tally by class, surfaced via {@link health}. */
        this.errorTally = new Map();
        this.bin = opts.bin ?? CURSOR_BIN;
        this.execFileFn = opts.execFileFn ?? child_process_1.execFile;
        this.spawnFn = opts.spawnFn ?? child_process_1.spawn;
    }
    /** @see Runner.detect — probes `cursor-agent --version` on `$PATH`. */
    async detect() {
        const execFileAsync = (0, util_1.promisify)(this.execFileFn);
        try {
            const { stdout } = await execFileAsync(this.bin, ['--version'], {
                timeout: 10000,
            });
            return {
                found: true,
                version: stdout.trim() || 'unknown',
                path: this.bin,
            };
        }
        catch (err) {
            const code = err.code;
            if (code === 'ENOENT') {
                return {
                    found: false,
                    reason: 'not_installed',
                    hint: 'cursor-agent not found on PATH. Install the Cursor CLI from https://cursor.com.',
                };
            }
            return {
                found: false,
                reason: 'not_installed',
                hint: `cursor-agent --version failed: ${err instanceof Error ? err.message : String(err)}`,
            };
        }
    }
    /**
     * Build the `cursor-agent` argument list for a dispatch.
     *
     * Exposed for unit tests (RFC §8.1 flag-translation tests).
     *
     * @param opts - the dispatch options.
     * @returns the argument vector passed to `spawn`.
     */
    buildArgs(opts) {
        const args = ['--no-interactive', '--prompt', opts.prompt, '--workdir', opts.workingDir];
        if (opts.sessionId !== undefined) {
            // RFC §9.1: resume flag name pending verification against cursor-agent docs.
            args.push('--resume', opts.sessionId);
        }
        if (opts.agentProfile !== undefined) {
            args.push('--agent', opts.agentProfile);
        }
        // §3 trust-preset translation. Deny list is inverted against
        // `--auto-approve=all` for the `turbo` preset (see TRUST_PRESET_TABLE).
        const trust = (0, registry_1.translateTrust)(this.id, opts.trust);
        args.push(...trust.flags);
        if (opts.trust === 'turbo' && opts.trustDenyList && opts.trustDenyList.length > 0) {
            args.push(`--deny=${opts.trustDenyList.join(',')}`);
        }
        return args;
    }
    /** @see Runner.dispatch */
    async dispatch(opts) {
        return this.run(this.buildArgs(opts), opts.sessionId, opts.timeoutMs, opts.env, opts.workingDir);
    }
    /** @see Runner.resume */
    async resume(sessionId, prompt, opts) {
        const merged = {
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
        };
        return this.dispatch(merged);
    }
    /**
     * @see Runner.listSessions
     *
     * `cursor-agent` has no stable session-list subcommand yet (RFC §9.1);
     * returns an empty list until the host surface is verified.
     */
    async listSessions() {
        return [];
    }
    /** @see Runner.health */
    async health() {
        const detection = await this.detect();
        const cliVersion = detection.found ? detection.version : 'not_installed';
        return {
            ok: detection.found,
            authPresent: detection.found,
            cliVersion,
            mcpServersConfigured: 0,
            lastDispatchAt: this.lastDispatchAt,
            recentErrors: [...this.errorTally.entries()].map(([cls, count]) => ({
                class: cls,
                count,
            })),
        };
    }
    /**
     * @see Runner.cancel
     *
     * `cursor-agent` exposes no out-of-band cancel; in-flight dispatches are
     * hard-killed by the orchestrator via its 2× timeout. This is a no-op so
     * callers can treat cancel uniformly across runners.
     */
    async cancel(_sessionId) {
        // No-op: cancellation is handled by the orchestrator's timeout kill.
    }
    /**
     * Spawn `cursor-agent`, capture output, and normalize the result.
     *
     * @param args        - the argument vector.
     * @param sessionId   - resumed session id, echoed back when present.
     * @param timeoutMs   - soft cap; the subprocess is killed at this value.
     * @param env         - extra environment variables.
     * @param workingDir  - subprocess cwd.
     */
    run(args, sessionId, timeoutMs, env, workingDir) {
        const startedAt = Date.now();
        const cap = timeoutMs ?? DEFAULT_TIMEOUT_MS;
        return new Promise((resolve) => {
            let stdout = '';
            let stderr = '';
            let timedOut = false;
            let settled = false;
            const child = this.spawnFn(this.bin, args, {
                cwd: workingDir,
                env: { ...process.env, ...env },
            });
            const killer = setTimeout(() => {
                timedOut = true;
                child.kill('SIGTERM');
            }, cap);
            child.stdout?.on('data', (chunk) => {
                stdout += chunk.toString();
            });
            child.stderr?.on('data', (chunk) => {
                stderr += chunk.toString();
            });
            const finish = (exitCode) => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(killer);
                const errorClass = classifyCursorExit(exitCode, timedOut);
                if (errorClass !== undefined) {
                    this.errorTally.set(errorClass, (this.errorTally.get(errorClass) ?? 0) + 1);
                }
                const finishedAt = new Date();
                this.lastDispatchAt = finishedAt.toISOString();
                resolve({
                    ok: errorClass === undefined,
                    sessionId: sessionId ?? `cursor-${startedAt}`,
                    exitCode: exitCode ?? -1,
                    finishedAt: finishedAt.toISOString(),
                    durationMs: Date.now() - startedAt,
                    errorClass,
                    stdoutTail: tail(stdout || stderr),
                });
            };
            child.on('error', (err) => {
                // spawn failure (ENOENT etc.) — classify as internal.
                stderr += `\n[spawn error] ${err.message}`;
                finish(null);
            });
            child.on('close', (code) => finish(code));
        });
    }
}
exports.CursorRunner = CursorRunner;
/** Singleton runner instance for registration. */
exports.cursorRunner = new CursorRunner();
//# sourceMappingURL=cursor.js.map