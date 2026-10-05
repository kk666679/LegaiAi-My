"use strict";
/**
 * daemon/autoclawd.ts — the AutoClaw Control headless daemon (CP-3.1).
 *
 * Runs the fleet with NO IDE open: it COMPOSES what already exists — the
 * orchestrator loop (`startOrchestratorLoop`, which already ticks GC + consensus
 * tally + spine ingest + board write + dispatch under the single-writer lease),
 * the FLEET-DIGEST producer (the same `gatherFleetData → buildFleetDigest` path
 * the panel + the `fleet.digest` MCP tool use — both vscode-free), and the
 * loopback bridge. `eternal_loop.ts` is the demo of this idea (and has a
 * double-start defect); autoclawd composes `startOrchestratorLoop` DIRECTLY and
 * does not import it.
 *
 * Bind policy: the bridge binds **127.0.0.1 only, always** (spec §3.6) — no
 * firewall prompt, no cleartext-LAN bearer. Remote reach is a later, separate
 * concern (Tailscale Serve over a dedicated web-UI listener).
 *
 * Pure/testable core: {@link checkNodeVersion}, {@link resolveDaemonConfig},
 * {@link produceDigestOnce}, {@link isProcessAlive}. The `startAutoclawd`
 * composition wires them to the real loop + bridge.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DIGEST_INTERVAL_MS = exports.DEFAULT_TICK_MS = exports.DAEMON_BRIDGE_PORT_DEFAULT = exports.MIN_NODE_MINOR = exports.MIN_NODE_MAJOR = void 0;
exports.checkNodeVersion = checkNodeVersion;
exports.resolveDaemonConfig = resolveDaemonConfig;
exports.produceDigestOnce = produceDigestOnce;
exports.isProcessAlive = isProcessAlive;
exports.acquirePidLock = acquirePidLock;
exports.startAutoclawd = startAutoclawd;
const fs = require("fs");
const os = require("os");
const path = require("path");
const orchestratorLoop_1 = require("../orchestratorLoop");
const bridge_1 = require("../bridge");
const webui_1 = require("./webui");
const push_1 = require("./push");
const fleetData_1 = require("../panel/fleetData");
const fleetDigest_1 = require("../fleet/fleetDigest");
const read_1 = require("../spine/read");
const proof_1 = require("../spine/proof");
const logRotation_1 = require("./logRotation");
/* -------------------------------------------------------------------------- */
/*  Node version gate                                                          */
/* -------------------------------------------------------------------------- */
/** node:sqlite (the spine + KG backend) needs Node ≥ 22.5. */
exports.MIN_NODE_MAJOR = 22;
exports.MIN_NODE_MINOR = 5;
/**
 * Parse `process.version`-style strings and decide whether node:sqlite is
 * available. Below the floor the daemon still RUNS (the loop + bridge are fine);
 * only the SQLite-backed spine/KG degrade — so this is an actionable warning, not
 * a hard stop.
 */
function checkNodeVersion(version = process.version) {
    const m = /^v?(\d+)\.(\d+)\./.exec(version);
    const major = m ? Number(m[1]) : 0;
    const minor = m ? Number(m[2]) : 0;
    const ok = major > exports.MIN_NODE_MAJOR || (major === exports.MIN_NODE_MAJOR && minor >= exports.MIN_NODE_MINOR);
    if (ok) {
        return { ok, major, minor };
    }
    return {
        ok, major, minor,
        message: `Node ${version} is below the ${exports.MIN_NODE_MAJOR}.${exports.MIN_NODE_MINOR} needed for node:sqlite — ` +
            `the Event Spine + KG will run degraded. Upgrade Node, or install the better-sqlite3 ` +
            `fallback (npm i better-sqlite3) so the SQLite driver order can find a backend.`,
    };
}
/* -------------------------------------------------------------------------- */
/*  Config                                                                     */
/* -------------------------------------------------------------------------- */
/** Reserved daemon bridge-port band — distinct from the per-IDE bands (9876+). */
exports.DAEMON_BRIDGE_PORT_DEFAULT = 9979;
exports.DEFAULT_TICK_MS = 30000;
exports.DEFAULT_DIGEST_INTERVAL_MS = 15000;
/** Resolve the daemon config from options + env (pure). Env overrides:
 *  AUTOCLAW_WORKSPACE, AUTOCLAW_TICK_MS, AUTOCLAW_BRIDGE_PORT. */
function resolveDaemonConfig(opts = {}, env = process.env) {
    const workspaceRoot = path.resolve(opts.workspaceRoot ?? env.AUTOCLAW_WORKSPACE ?? process.cwd());
    const home = opts.homeDir ?? os.homedir();
    const num = (v, d) => {
        const n = v !== undefined ? Number(v) : NaN;
        return Number.isFinite(n) && n > 0 ? Math.floor(n) : d;
    };
    const commsDir = path.join(workspaceRoot, '.autoclaw', 'orchestrator', 'comms');
    const controlDir = path.join(home, '.autoclaw', 'control');
    return {
        workspaceRoot,
        tickMs: opts.tickMs ?? num(env.AUTOCLAW_TICK_MS, exports.DEFAULT_TICK_MS),
        bridgePort: opts.bridgePort ?? num(env.AUTOCLAW_BRIDGE_PORT, exports.DAEMON_BRIDGE_PORT_DEFAULT),
        webUiPort: opts.webUiPort ?? num(env.AUTOCLAW_WEBUI_PORT, webui_1.DAEMON_WEBUI_PORT_DEFAULT),
        digestIntervalMs: opts.digestIntervalMs ?? exports.DEFAULT_DIGEST_INTERVAL_MS,
        bindHost: '127.0.0.1',
        commsDir,
        tokensPath: path.join(workspaceRoot, '.autoclaw', 'bridge', 'tokens.json'),
        controlDir,
        pidPath: path.join(workspaceRoot, '.autoclaw', 'control', 'daemon.pid'),
        discoveryPath: path.join(controlDir, 'daemon.json'),
        logFile: path.join(controlDir, 'logs', 'autoclawd.log'),
        requireAuth: opts.requireAuth ?? (env.AUTOCLAW_REQUIRE_AUTH === '1' || env.AUTOCLAW_REQUIRE_AUTH === 'true'),
        ...(opts.publicBaseUrl ?? env.AUTOCLAW_PUBLIC_URL ? { publicBaseUrl: (opts.publicBaseUrl ?? env.AUTOCLAW_PUBLIC_URL).replace(/\/$/, '') } : {}),
    };
}
/* -------------------------------------------------------------------------- */
/*  Digest producer                                                            */
/* -------------------------------------------------------------------------- */
function readJsonSafe(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
    }
    catch {
        return null;
    }
}
function writeAtomic(file, contents) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, contents, 'utf8');
    fs.renameSync(tmp, file);
}
/**
 * Produce the FLEET-DIGEST once — the SAME `gatherFleetData → buildFleetDigest`
 * path the panel + `fleet.digest` MCP tool use, so there is no second data path
 * to drift against. Writes `fleet-status.json` atomically. Best-effort: returns
 * false (never throws) on any gather/write failure.
 */
async function produceDigestOnce(workspaceRoot, nowIso) {
    try {
        const model = await (0, fleetData_1.gatherFleetData)({ workspaceRoot, selfAgentId: 'autoclawd' });
        const board = readJsonSafe(path.join(workspaceRoot, '.autoclaw', 'orchestrator', 'board.json'));
        const digestModel = board ? { ...model, board } : model;
        // CP-3.3: attach event-spine freshness so the glance shows how current the
        // index is. Read-only + best-effort; absent spine ⇒ field omitted.
        const fresh = (0, read_1.readSpineFreshness)(workspaceRoot);
        if (fresh.spine_present) {
            digestModel.spine = { indexed_events: fresh.indexed_events, ...(fresh.last_event_at ? { last_event_at: fresh.last_event_at } : {}) };
        }
        const digest = (0, fleetDigest_1.buildFleetDigest)(digestModel, nowIso);
        writeAtomic(path.join(workspaceRoot, fleetDigest_1.FLEET_STATUS_REL_PATH), (0, fleetDigest_1.serializeFleetDigest)(digest));
        // CP-1.5: once wave-1 backfill has completed, PROVE the spine matches the
        // source at this owner digest write. Best-effort + isolated — a proof failure
        // must never disturb the digest that already landed.
        try {
            if ((0, proof_1.isProofArmed)(workspaceRoot)) {
                (0, proof_1.appendProofRecord)(workspaceRoot, (0, proof_1.runConsensusParityProof)(workspaceRoot, new Date(nowIso)));
            }
        }
        catch { /* proof is observability, never fatal */ }
        return true;
    }
    catch {
        return false;
    }
}
/* -------------------------------------------------------------------------- */
/*  Single-instance guard                                                      */
/* -------------------------------------------------------------------------- */
/** Is `pid` a live process? `kill(pid, 0)` throws ESRCH when it is not. */
function isProcessAlive(pid) {
    if (!Number.isInteger(pid) || pid <= 0) {
        return false;
    }
    try {
        process.kill(pid, 0);
        return true;
    }
    catch (e) {
        return e.code === 'EPERM';
    } // EPERM = exists, not ours
}
/** Acquire the per-workspace single-instance pid lock. Returns false when another
 *  live daemon already holds it (a stale pid is taken over). */
function acquirePidLock(pidPath, pid = process.pid) {
    try {
        const existing = readJsonSafe(pidPath);
        if (existing && typeof existing.pid === 'number' && existing.pid !== pid && isProcessAlive(existing.pid)) {
            return false; // another live daemon owns this workspace
        }
        writeAtomic(pidPath, JSON.stringify({ pid, started_at: new Date().toISOString() }, null, 2));
        return true;
    }
    catch {
        return true; // if we can't read the lock, don't block startup
    }
}
/**
 * Start the daemon: node check → pid guard → orchestrator loop → loopback bridge
 * → digest producer → discovery file. Returns a handle whose `stop()` tears it
 * all down. Throws only when the single-instance guard is held by a live daemon.
 */
async function startAutoclawd(opts = {}) {
    const config = resolveDaemonConfig(opts);
    const consoleLog = opts.logger ?? ((line) => console.log(`[autoclawd] ${line}`));
    // Compose the console/opts logger with a durable rotated file log (CP-3.2) so a
    // detached daemon still leaves a trail. File logging never throws or blocks start.
    const fileLogger = opts.logToFile === false ? null : (0, logRotation_1.createRotatingLogger)(config.logFile);
    const log = fileLogger
        ? (line) => { consoleLog(line); fileLogger.log(line); }
        : consoleLog;
    const nodeCheck = checkNodeVersion();
    if (!nodeCheck.ok) {
        log(`WARN ${nodeCheck.message}`);
    }
    if (!acquirePidLock(config.pidPath)) {
        throw new Error(`autoclawd is already running for ${config.workspaceRoot} (see ${config.pidPath})`);
    }
    log(`starting on ${config.workspaceRoot} (tick ${config.tickMs}ms, bridge ${config.bindHost}:${config.bridgePort})`);
    // 1. Orchestrator loop — single active manager, headless.
    const loop = (0, orchestratorLoop_1.startOrchestratorLoop)({ workspaceRoot: config.workspaceRoot, tickMs: config.tickMs, singleActive: true });
    // 2. Loopback bridge (best-effort — a bind failure must not down the loop).
    let bridge = null;
    try {
        bridge = await (0, bridge_1.startBridge)({
            port: config.bridgePort, host: config.bindHost,
            commsDir: config.commsDir, tokensPath: config.tokensPath,
            workspaceRoot: config.workspaceRoot,
        });
        log(`bridge on ${config.bindHost}:${bridge.config.port}`);
    }
    catch (e) {
        log(`WARN bridge failed to start: ${e.message}`);
    }
    // 3. Web UI on its DEDICATED loopback listener (the only thing ever proxied —
    //    never the bridge port). Read-only P1. Best-effort — a bind failure must
    //    not down the loop.
    let webui = null;
    try {
        webui = await (0, webui_1.startWebUi)({ workspaceRoot: config.workspaceRoot, port: config.webUiPort, host: config.bindHost, publicBaseUrl: config.publicBaseUrl, requireAuth: config.requireAuth });
        log(`web UI on http://${config.bindHost}:${webui.port}`);
    }
    catch (e) {
        log(`WARN web UI failed to start: ${e.message}`);
    }
    // 5. Digest producer — keep fleet-status.json fresh with no IDE open. The
    //    CP-4.4 push tick rides the same cadence: after each digest, notify
    //    enrolled devices of NEW awaiting-you items (free when nobody enrolled;
    //    best-effort — a push failure must never disturb the digest or the loop).
    await produceDigestOnce(config.workspaceRoot, new Date().toISOString());
    const digestTimer = setInterval(() => {
        void produceDigestOnce(config.workspaceRoot, new Date().toISOString())
            .then(() => (0, push_1.runPushTick)(config.workspaceRoot, { log }))
            .catch(() => { });
    }, config.digestIntervalMs);
    if (typeof digestTimer.unref === 'function') {
        digestTimer.unref();
    }
    // 6. Discovery file so clients (web UI, CLI) find the daemon.
    try {
        writeAtomic(config.discoveryPath, JSON.stringify({
            pid: process.pid, started_at: new Date().toISOString(),
            bridge: { host: config.bindHost, port: bridge?.config.port ?? config.bridgePort },
            web_ui: { host: config.bindHost, port: webui?.port ?? config.webUiPort },
            workspaces: [config.workspaceRoot],
        }, null, 2));
    }
    catch { /* best-effort */ }
    let stopped = false;
    const stop = async () => {
        if (stopped) {
            return;
        }
        stopped = true;
        clearInterval(digestTimer);
        try {
            loop.stop();
        }
        catch { /* ignore */ }
        if (bridge?.server) {
            try {
                bridge.server.close();
            }
            catch { /* ignore */ }
        }
        if (webui) {
            try {
                await webui.stop();
            }
            catch { /* ignore */ }
        }
        try {
            fs.rmSync(config.pidPath, { force: true });
        }
        catch { /* ignore */ }
        log('stopped');
    };
    return { config, loop, bridge, webui, stop };
}
//# sourceMappingURL=autoclawd.js.map