"use strict";
/**
 * autogpt.ts — `runner-autogpt` adapter (Sprint 4 / WA-2, F4).
 *
 * Drives AutoGPT as a {@link Runner}. AutoGPT can run two ways and this
 * adapter supports both behind one runner id:
 *
 *  1. **Remote** — an AutoGPT server (the AutoGPT Platform / `agpt server`)
 *     already running and reachable over HTTP. Configured by `AUTOGPT_ENDPOINT`.
 *  2. **Local process** — no server running; the adapter launches a local
 *     AutoGPT process on first use, waits for its HTTP port to come up, then
 *     drives it exactly like the remote case.
 *
 * It extends {@link LoopServiceAdapter}: the dispatch/poll/heartbeat
 * machinery is shared; this subclass adds process management and an
 * AutoGPT-shaped request body.
 *
 * Uses the Node 18+ global `fetch`; no third-party HTTP client.
 *
 * @see docs/rfc/runner-bridge-contract.md §2, §3, §7
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.autogptRunner = exports.AutoGptRunner = void 0;
const child_process_1 = require("child_process");
const loop_service_adapter_1 = require("./loop-service-adapter");
/** Default endpoint a locally launched AutoGPT server is expected on. */
const DEFAULT_LOCAL_ENDPOINT = 'http://127.0.0.1:8000';
/** Default time budget for a launched process to start serving HTTP. */
const DEFAULT_LAUNCH_TIMEOUT_MS = 30000;
/**
 * Resolve the effective {@link AutoGptConfig} from an explicit config object
 * merged over environment-variable defaults.
 */
function resolveConfig(config = {}) {
    const envCommand = process.env.AUTOGPT_COMMAND?.trim();
    return {
        endpoint: config.endpoint ?? process.env.AUTOGPT_ENDPOINT ?? undefined,
        tokenEnv: config.tokenEnv ?? 'AUTOGPT_TOKEN',
        launchCommand: config.launchCommand ??
            (envCommand && envCommand.length > 0 ? envCommand.split(/\s+/) : undefined),
        localEndpoint: config.localEndpoint ?? DEFAULT_LOCAL_ENDPOINT,
        pollIntervalMs: config.pollIntervalMs ?? 2000,
        launchTimeoutMs: config.launchTimeoutMs ?? DEFAULT_LAUNCH_TIMEOUT_MS,
    };
}
/**
 * Build the {@link LoopServiceConfig} the base adapter is constructed from.
 * AutoGPT's REST shape: `POST /api/v1/agents/run`, poll
 * `GET /api/v1/agents/run/{id}`.
 */
function loopConfigFor(effectiveEndpoint, tokenEnv, pollIntervalMs) {
    return {
        id: 'autogpt',
        endpoint: effectiveEndpoint,
        auth: { kind: 'bearer', tokenEnv },
        routes: {
            health: '/health',
            dispatch: '/api/v1/agents/run',
            status: '/api/v1/agents/run/{id}',
            cancel: '/api/v1/agents/run/{id}',
            list: '/api/v1/agents/runs',
        },
        pollIntervalMs,
        idField: 'run_id',
        capabilities: {
            resumableSessions: true,
            jsonStructuredOutput: true,
            mcpServers: false,
            browser: true,
            customAgents: true,
            toolTrustGranularity: 'all-or-nothing',
        },
    };
}
/* -------------------------------------------------------------------------- */
/*  AutoGptRunner                                                             */
/* -------------------------------------------------------------------------- */
/** Sleep helper. */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * `runner-autogpt` — an AutoGPT impl on top of {@link LoopServiceAdapter}.
 *
 * When configured with a remote endpoint it behaves as a thin HTTP client.
 * Otherwise it launches and supervises a local AutoGPT process, ensuring the
 * server is up before the first dispatch and tearing it down on
 * {@link AutoGptRunner.shutdown}.
 */
class AutoGptRunner extends loop_service_adapter_1.LoopServiceAdapter {
    constructor(config = {}) {
        const resolved = resolveConfig(config);
        const isRemote = Boolean(resolved.endpoint && resolved.endpoint.trim() !== '');
        const effectiveEndpoint = isRemote
            ? resolved.endpoint
            : resolved.localEndpoint;
        super(loopConfigFor(effectiveEndpoint, resolved.tokenEnv, resolved.pollIntervalMs));
        /** Set once a launched process's HTTP port has been observed up. */
        this.localReady = false;
        this.autogpt = resolved;
        this.isRemote = isRemote;
    }
    /* ----------------------------------------------------------------------- */
    /*  detect()                                                               */
    /* ----------------------------------------------------------------------- */
    /**
     * Probe AutoGPT. For a remote endpoint this is the inherited HTTP health
     * check. For a local launch it reports `not_installed` with a hint unless
     * a launch command is configured (the process is only spawned lazily on
     * the first {@link dispatch}, never during detection).
     */
    async detect() {
        if (this.isRemote) {
            return super.detect();
        }
        if (!this.autogpt.launchCommand || this.autogpt.launchCommand.length === 0) {
            return {
                found: false,
                reason: 'not_installed',
                hint: 'AutoGPT is not configured. Set AUTOGPT_ENDPOINT for a running server, or AUTOGPT_COMMAND to launch one locally.',
            };
        }
        // A local launch is configured but not yet started. Probe the local
        // endpoint in case a server is already up; otherwise report it as
        // available-on-demand via a found result with an "on demand" version.
        const probe = await super.detect();
        if (probe.found) {
            return probe;
        }
        return {
            found: true,
            version: 'launch-on-demand',
            path: this.autogpt.launchCommand.join(' '),
        };
    }
    /* ----------------------------------------------------------------------- */
    /*  dispatch()                                                             */
    /* ----------------------------------------------------------------------- */
    /**
     * Run a prompt through AutoGPT. For a local configuration this launches
     * the process (if not already running) and waits for its HTTP port before
     * delegating to the inherited dispatch/poll loop.
     */
    async dispatch(opts) {
        const startedAt = Date.now();
        if (!this.isRemote) {
            const launched = await this.ensureLocalProcess();
            if (!launched) {
                return this.fail(startedAt, opts.sessionId, 'internal', -1);
            }
        }
        return super.dispatch(opts);
    }
    /* ----------------------------------------------------------------------- */
    /*  Request body                                                           */
    /* ----------------------------------------------------------------------- */
    /**
     * AutoGPT's run endpoint expects `task` + `agent_settings` rather than the
     * generic loop-service `prompt` body. Override accordingly.
     */
    buildDispatchBody(opts) {
        return {
            task: opts.prompt,
            run_id: opts.sessionId,
            agent_settings: {
                continuous_mode: opts.trust === 'turbo',
                continuous_limit: opts.trust === 'turbo' ? 0 : 1,
                working_directory: opts.workingDir,
                denied_commands: opts.trustDenyList ?? [],
            },
            env: opts.env,
        };
    }
    /* ----------------------------------------------------------------------- */
    /*  Local process management                                               */
    /* ----------------------------------------------------------------------- */
    /**
     * Launch the local AutoGPT process if it is not already running, then wait
     * for its HTTP port to accept a health check.
     *
     * @returns `true` once the local server is responding; `false` on launch
     *          failure or if the port never comes up within the budget.
     */
    async ensureLocalProcess() {
        if (this.localReady && this.localProcess && this.localProcess.exitCode === null) {
            return true;
        }
        const command = this.autogpt.launchCommand;
        if (!command || command.length === 0) {
            return false;
        }
        if (!this.localProcess || this.localProcess.exitCode !== null) {
            try {
                this.localProcess = (0, child_process_1.spawn)(command[0], command.slice(1), {
                    windowsHide: true,
                    stdio: ['ignore', 'ignore', 'ignore'],
                    env: { ...process.env },
                });
            }
            catch {
                this.localProcess = undefined;
                return false;
            }
            this.localReady = false;
            this.localProcess.on('exit', () => {
                this.localReady = false;
            });
            this.localProcess.on('error', () => {
                this.localReady = false;
            });
        }
        // Wait for the server to start serving HTTP.
        const deadline = Date.now() + this.autogpt.launchTimeoutMs;
        while (Date.now() < deadline) {
            if (this.localProcess.exitCode !== null) {
                return false; // process died during startup
            }
            try {
                const res = await fetch(`${this.autogpt.localEndpoint}/health`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000),
                });
                if (res.ok) {
                    this.localReady = true;
                    return true;
                }
            }
            catch {
                // Not up yet — keep waiting.
            }
            await delay(1000);
        }
        return false;
    }
    /**
     * Terminate a locally launched AutoGPT process, if any. No-op for a remote
     * configuration. The orchestrator calls this on extension shutdown.
     */
    async shutdown() {
        const proc = this.localProcess;
        if (proc && proc.exitCode === null) {
            proc.kill('SIGTERM');
        }
        this.localProcess = undefined;
        this.localReady = false;
    }
}
exports.AutoGptRunner = AutoGptRunner;
/** Convenience singleton — registered with the {@link import('./registry').RunnerRegistry}. */
exports.autogptRunner = new AutoGptRunner();
//# sourceMappingURL=autogpt.js.map