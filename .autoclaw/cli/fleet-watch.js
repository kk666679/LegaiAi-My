import fs from 'fs';
import path from 'path';
import * as heartbeatReader_1 from '../lmd/heartbeatReader.js'; // MISSING TARGET
import * as strategyChain_1 from '../keepalive/strategyChain.js'; // MISSING TARGET

/**
 * fleet-watch.ts — `autoclaw fleet watch` cron-style keep-alive loop
 * (Sprint 4 / WA-3 I3).
 *
 * Periodically checks LMD health and re-kicks any stalled agent through its
 * per-agent keep-alive strategy chain (`runner → cli → computer_use → toast`).
 *
 *   autoclaw fleet watch --interval 5m
 *
 * Responsibilities:
 *   1. Run a {@link HeartbeatReader} (zero-token, pure file I/O) so LMD health
 *      is current.
 *   2. On each scheduled tick, find every `stalled` agent and run its
 *      {@link StrategyChain}.
 *   3. Append a JSONL record of every chain run to
 *      `.autoclaw/runtime/keepalive.log`.
 *   4. Export {@link watchFleetCommand} for the "AutoClaw: Watch Fleet" VS Code
 *      command (toggle), and {@link fleetWatchStatusBarText} for the status bar.
 *
 * *** NO LLM CALLS. Pure file I/O + scheduling + child-process strategies. ***
 */

FleetWatcher = exports.DEFAULT_WATCH_INTERVAL_MS = void 0;

/* -------------------------------------------------------------------------- */
/*  Interval parsing                                                          */
/* -------------------------------------------------------------------------- */
/** Default watch interval: 5 minutes. */
export let DEFAULT_WATCH_INTERVAL_MS = 5 * 60 * 1000;
/**
 * Parse a human interval string (`"5m"`, `"30s"`, `"1h"`, or a bare number of
 * milliseconds) into milliseconds. Falls back to {@link DEFAULT_WATCH_INTERVAL_MS}
 * for empty / unparseable input. Clamped to a 10 s floor so the loop cannot
 * busy-spin.
 */
function parseInterval(raw) {
    if (!raw) {
        return exports.DEFAULT_WATCH_INTERVAL_MS;
    }
    const m = /^(\d+)\s*(ms|s|m|h)?$/i.exec(raw.trim());
    if (!m) {
        return exports.DEFAULT_WATCH_INTERVAL_MS;
    }
    const n = parseInt(m[1], 10);
    const unit = (m[2] ?? 'ms').toLowerCase();
    const ms = unit === 'h' ? n * 3600000 :
        unit === 'm' ? n * 60000 :
            unit === 's' ? n * 1000 :
                n;
    return Math.max(10000, ms);
}
/** Append an entry to `<workspaceRoot>/.autoclaw/runtime/keepalive.log`. */
function appendKeepaliveLog(workspaceRoot, entry, logger) {
    const file = path.join(workspaceRoot, '.autoclaw', 'runtime', 'keepalive.log');
    try {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.appendFileSync(file, JSON.stringify(entry) + '\n', 'utf8');
    }
    catch (err) {
        logger.error(`fleet watch: failed to append keepalive.log: ${String(err)}`);
    }
}
/* -------------------------------------------------------------------------- */
/*  Status bar helper                                                         */
/* -------------------------------------------------------------------------- */
/**
 * Text for the VS Code status-bar item that reflects the fleet-watch toggle.
 *
 * @param active     - Whether the watch loop is running.
 * @param stalledNow - Count of agents stalled at the last tick (optional).
 */
function fleetWatchStatusBarText(active, stalledNow) {
    if (!active) {
        return '$(eye-closed) fleet watch off';
    }
    const suffix = stalledNow && stalledNow > 0 ? ` — ${stalledNow} re-kicking` : '';
    return `$(eye) fleet watch active${suffix}`;
}
/**
 * The cron-style keep-alive loop. Drives a {@link HeartbeatReader} for LMD
 * health and, on each tick, re-kicks every stalled agent via its
 * {@link StrategyChain}.
 */
class FleetWatcher {
    constructor(opts = {}) {
        this.timer = null;
        this._active = false;
        this._lastStalledCount = 0;
        this.workspaceRoot = opts.workspaceRoot ?? process.cwd();
        this.intervalMs = opts.intervalMs ?? exports.DEFAULT_WATCH_INTERVAL_MS;
        this.logger = opts.logger ?? console;
        this.reader = opts.reader ?? new heartbeatReader_1.HeartbeatReader(this.workspaceRoot);
        this.chain = opts.chain ?? new strategyChain_1.StrategyChain({
            workspaceRoot: this.workspaceRoot,
            logger: this.logger,
            ...opts.chainOptions,
        });
    }
    /** True while the watch loop is running. */
    get isActive() { return this._active; }
    /** Count of agents found stalled at the most recent tick. */
    get lastStalledCount() { return this._lastStalledCount; }
    /** Status-bar text for the current state. */
    statusBarText() {
        return fleetWatchStatusBarText(this._active, this._lastStalledCount);
    }
    /**
     * Start the watch loop. Boots the {@link HeartbeatReader}, runs an immediate
     * tick, then schedules ticks on the interval. Idempotent.
     */
    start() {
        if (this._active) {
            return;
        }
        this._active = true;
        this.reader.start();
        appendKeepaliveLog(this.workspaceRoot, { at: new Date().toISOString(), event: 'watch_start', detail: `interval ${this.intervalMs}ms` }, this.logger);
        this.logger.info(`fleet watch: active (interval ${Math.round(this.intervalMs / 1000)}s).`);
        void this.tick();
        this.timer = setInterval(() => { void this.tick(); }, this.intervalMs);
    }
    /** Stop the watch loop and the underlying reader. Idempotent. */
    stop() {
        if (!this._active) {
            return;
        }
        this._active = false;
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.reader.stop();
        appendKeepaliveLog(this.workspaceRoot, { at: new Date().toISOString(), event: 'watch_stop' }, this.logger);
        this.logger.info('fleet watch: stopped.');
    }
    /**
     * Run a single watch sweep: read LMD health, re-kick every `stalled` agent.
     * Exposed (not just internal) so the VS Code command and tests can run a
     * sweep on demand.
     */
    async tick() {
        const at = new Date().toISOString();
        const health = this.reader.getHealthGrid();
        const stalledAgents = health.filter((h) => h.state === 'stalled');
        this._lastStalledCount = stalledAgents.length;
        appendKeepaliveLog(this.workspaceRoot, { at, event: 'watch_tick', detail: `${health.length} agent(s), ${stalledAgents.length} stalled` }, this.logger);
        const chains = [];
        for (const agent of stalledAgents) {
            const config = (0, strategyChain_1.loadKeepaliveConfig)(this.workspaceRoot, agent.agentId);
            let result;
            try {
                result = await this.chain.run(config, agent);
            }
            catch (err) {
                // StrategyChain.run never rejects, but defend anyway.
                result = {
                    agentId: agent.agentId, ok: false, succeededWith: null, attempts: [],
                    at: new Date().toISOString(),
                };
                this.logger.error(`fleet watch: chain run threw for "${agent.agentId}": ${String(err)}`);
            }
            chains.push(result);
            appendKeepaliveLog(this.workspaceRoot, { at: new Date().toISOString(), event: 'chain_run', agentId: agent.agentId, chain: result }, this.logger);
            this.logger.info(`fleet watch: "${agent.agentId}" stalled — chain ${result.ok ? `succeeded via "${result.succeededWith}"` : 'exhausted with no success'}.`);
        }
        return { at, health, stalled: stalledAgents.map((a) => a.agentId), chains };
    }
}

/* -------------------------------------------------------------------------- */
/*  VS Code command (toggle)                                                  */
/* -------------------------------------------------------------------------- */
/**
 * Module-level singleton so the "AutoClaw: Watch Fleet" command toggles the
 * SAME watcher each invocation.
 */
let activeWatcher = null;
/**
 * Toggle handler for the "AutoClaw: Watch Fleet" VS Code command.
 *
 * First call starts a {@link FleetWatcher}; the next stops it.
 *
 * WIRED: registered as `autoclaw.watchFleet` in `src/extension.ts` `activate()`,
 * which binds the returned {@link WatchFleetCommandResult.statusBarText} to a
 * `vscode.StatusBarItem` and stops the watcher on deactivate.
 *
 * @param opts - `workspaceRoot` and (optionally) the interval / a VS Code
 *               notify bridge forwarded to the strategy chain.
 */
function watchFleetCommand(opts = {}) {
    if (activeWatcher && activeWatcher.isActive) {
        activeWatcher.stop();
        const text = activeWatcher.statusBarText();
        activeWatcher = null;
        return { active: false, statusBarText: text };
    }
    activeWatcher = new FleetWatcher(opts);
    activeWatcher.start();
    return { active: true, statusBarText: activeWatcher.statusBarText() };
}
/** The watcher the VS Code command currently owns, or `null`. Mostly for tests. */
function currentWatcher() {
    return activeWatcher;
}
/* -------------------------------------------------------------------------- */
/*  CLI entry point                                                           */
/* -------------------------------------------------------------------------- */
/**
 * `autoclaw fleet watch` CLI entry point.
 *
 * Flags:
 *   --interval <5m|30s|1h|ms>  watch interval (default 5m)
 *   --workspace <path>         workspace root (default cwd)
 *   --once                     run a single sweep and exit (CI / cron-driven)
 */
async function main(argv = process.argv.slice(2)) {
    const arg = (name) => {
        const i = argv.indexOf(name);
        return i >= 0 && argv[i + 1] ? argv[i + 1] : undefined;
    };
    const workspaceRoot = arg('--workspace') ?? process.cwd();
    const intervalMs = parseInterval(arg('--interval'));
    const once = argv.includes('--once');
    const watcher = new FleetWatcher({ workspaceRoot, intervalMs });
    if (once) {
        // Single sweep — boot the reader, give it one poll, sweep, exit.
        const result = await watcher.tick();
        console.log(`fleet watch --once: ${result.health.length} agent(s), ` +
            `${result.stalled.length} stalled, ${result.chains.filter((c) => c.ok).length} re-kicked.`);
        return;
    }
    watcher.start();
    console.log(`fleet watch: ${watcher.statusBarText().replace(/\$\([^)]+\)\s*/g, '')}`);
    // Keep the process alive; stop cleanly on SIGINT/SIGTERM.
    const shutdown = () => { watcher.stop(); process.exit(0); };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
// Run as a CLI when invoked directly (not when imported).
if (require.main === module) {
    void main().catch((err) => {
        console.error('fleet watch: fatal error:', err instanceof Error ? err.message : err);
        process.exitCode = 1;
    });
}
//# sourceMappingURL=fleet-watch.js.map

export { parseInterval as parseInterval, fleetWatchStatusBarText as fleetWatchStatusBarText, watchFleetCommand as watchFleetCommand, currentWatcher as currentWatcher, main as main, FleetWatcher as FleetWatcher };
