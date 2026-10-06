import child_process_1 from 'child_process';
import fs from 'fs';
import path from 'path';
import * as registry_1 from '../runners/registry.js'; // MISSING TARGET
import * as codex_1 from '../runners/codex.js'; // MISSING TARGET
import * as hermes_1 from '../runners/hermes.js'; // MISSING TARGET
import * as openclaw_1 from '../runners/openclaw.js'; // MISSING TARGET
import * as heartbeatReader_1 from '../lmd/heartbeatReader.js'; // MISSING TARGET

/**
 * fleet-start.ts — `autoclaw fleet start` CLI (Sprint 2 / WA-4 task H1).
 *
 * Boots the AutoClaw runner fleet:
 *
 *   1. Read `.autoclaw/program/registry.json` to learn which runners to
 *      start. If the file is absent, fall back to detecting every known
 *      runner adapter.
 *   2. `detect()` + register every selected runner, in parallel.
 *   3. Start an LMD (Lightweight Monitoring Daemon) health monitor — as a
 *      detached subprocess when an LMD daemon entry exists, otherwise an
 *      in-process {@link HeartbeatReader} (zero-token, pure file I/O).
 *   4. Report which runners started / failed and the LMD status.
 *
 * The module exports {@link fleetStart} for programmatic use; a thin CLI
 * wrapper (`main`) runs it when the file is invoked directly.
 *
 * NO LLM calls — this is pure orchestration: file I/O, detection probes,
 * and process supervision.
 */
Object.defineProperty(exports, "__esModule", { value: true });

/* -------------------------------------------------------------------------- */
/*  Known runners                                                             */
/* -------------------------------------------------------------------------- */
/**
 * Every runner adapter AutoClaw ships. The registry.json `runners` list is
 * matched against these by `id`; unknown ids in the file are skipped with
 * a warning.
 */
const KNOWN_RUNNERS = {
    codex: codex_1.codexRunner,
    hermes: hermes_1.hermesRunner,
    openclaw: openclaw_1.openclawRunner,
};
/* -------------------------------------------------------------------------- */
/*  Registry file loading                                                     */
/* -------------------------------------------------------------------------- */
/**
 * Read `.autoclaw/program/registry.json`. Returns `null` when the file is
 * absent or unparseable — callers fall back to detecting all known runners.
 */
function loadProgramRegistry(workspaceRoot) {
    const file = path.join(workspaceRoot, '.autoclaw', 'program', 'registry.json');
    let raw;
    try {
        raw = fs.readFileSync(file, 'utf8');
    }
    catch {
        return null; // absent — tolerated per the H1 brief.
    }
    try {
        return JSON.parse(raw);
    }
    catch {
        return null; // present but malformed — treat as absent.
    }
}
/**
 * Resolve the set of runners to start: those named in registry.json (when
 * present and non-empty), otherwise every known runner.
 */
function resolveRunners(registry, logger) {
    if (registry?.runners && registry.runners.length > 0) {
        const selected = [];
        for (const id of registry.runners) {
            const runner = KNOWN_RUNNERS[id];
            if (runner) {
                selected.push(runner);
            }
            else {
                logger.warn(`fleet start: registry.json names unknown runner "${id}" — skipped.`);
            }
        }
        // If the file named only unknown runners, fall back rather than start nothing.
        return selected.length > 0 ? selected : Object.values(KNOWN_RUNNERS);
    }
    return Object.values(KNOWN_RUNNERS);
}
/* -------------------------------------------------------------------------- */
/*  LMD monitor                                                               */
/* -------------------------------------------------------------------------- */
/**
 * Start the LMD health monitor.
 *
 * Prefers a detached subprocess (`out/lmd/daemon.js`) when one has been
 * built; otherwise starts an in-process {@link HeartbeatReader}. The
 * in-process reader is pure file I/O and costs no LLM tokens, so it is a
 * safe default.
 */
function startLmdMonitor(workspaceRoot, logger) {
    // Look for a built LMD daemon entry point next to the compiled output.
    const daemonEntry = path.join(workspaceRoot, 'out', 'lmd', 'daemon.js');
    if (fs.existsSync(daemonEntry)) {
        try {
            const child = (0, child_process_1.spawn)(process.execPath, [daemonEntry, '--workspace', workspaceRoot], {
                cwd: workspaceRoot,
                detached: true,
                stdio: 'ignore',
            });
            child.unref();
            logger.info(`fleet start: LMD monitor running as subprocess (pid ${child.pid}).`);
            return { running: true, mode: 'subprocess', pid: child.pid };
        }
        catch (err) {
            logger.warn(`fleet start: failed to spawn LMD subprocess (${err instanceof Error ? err.message : String(err)}); falling back to in-process monitor.`);
        }
    }
    // In-process fallback: a HeartbeatReader polling the heartbeats directory.
    try {
        const reader = new heartbeatReader_1.HeartbeatReader(workspaceRoot);
        reader.start();
        logger.info('fleet start: LMD monitor running in-process (HeartbeatReader).');
        return { running: true, mode: 'in-process' };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`fleet start: LMD monitor failed to start: ${message}`);
        return { running: false, mode: 'failed', error: message };
    }
}
/* -------------------------------------------------------------------------- */
/*  fleetStart                                                                */
/* -------------------------------------------------------------------------- */
/**
 * Boot the AutoClaw runner fleet: detect + register all selected runners in
 * parallel and start the LMD health monitor.
 *
 * @param opts - fleet-start options; all optional.
 * @returns the aggregate result (per-runner outcomes + LMD status).
 */
async function fleetStart(opts = {}) {
    const workspaceRoot = opts.workspaceRoot ?? process.cwd();
    const logger = opts.logger ?? console;
    // ---- Resolve + register runners ----------------------------------------
    const registry = opts.registry ?? new registry_1.RunnerRegistry();
    if (!opts.registry) {
        const programRegistry = loadProgramRegistry(workspaceRoot);
        if (programRegistry === null) {
            logger.info('fleet start: no .autoclaw/program/registry.json — detecting all known runners.');
        }
        for (const runner of resolveRunners(programRegistry, logger)) {
            registry.register(runner);
        }
    }
    // ---- Detect in parallel -------------------------------------------------
    const detected = await registry.detect();
    const runners = detected.map((entry) => ({
        id: entry.runner.id,
        started: entry.enabled,
        detection: entry.detection ?? {
            found: false,
            reason: 'not_installed',
            hint: 'detection did not run',
        },
    }));
    const started = runners.filter((r) => r.started).map((r) => r.id);
    const failed = runners.filter((r) => !r.started).map((r) => r.id);
    for (const r of runners) {
        if (r.started && r.detection.found) {
            logger.info(`fleet start: runner "${r.id}" started (v${r.detection.version}).`);
        }
        else if (!r.detection.found) {
            logger.warn(`fleet start: runner "${r.id}" not started — ${r.detection.hint}`);
        }
    }
    // ---- LMD monitor --------------------------------------------------------
    const lmd = opts.skipLmd
        ? { running: false, mode: 'failed', error: 'skipped by caller' }
        : startLmdMonitor(workspaceRoot, logger);
    logger.info(`fleet start: ${started.length} runner(s) started, ${failed.length} failed; LMD ${lmd.running ? lmd.mode : 'not running'}.`);
    return { runners, started, failed, lmd };
}
/* -------------------------------------------------------------------------- */
/*  CLI wrapper                                                               */
/* -------------------------------------------------------------------------- */
/**
 * Thin CLI entry point for `autoclaw fleet start`.
 *
 * Exits non-zero when no runner could be started, so CI / scripts can gate
 * on a successful fleet boot.
 */
async function main(argv = process.argv.slice(2)) {
    // Support `--workspace <path>`; default to cwd.
    const wsIdx = argv.indexOf('--workspace');
    const workspaceRoot = wsIdx >= 0 && argv[wsIdx + 1] ? argv[wsIdx + 1] : process.cwd();
    const result = await fleetStart({ workspaceRoot });
    if (result.started.length === 0) {
        console.error('fleet start: no runners could be started — see hints above.');
        process.exitCode = 1;
        return;
    }
    console.log(`fleet start: ready — runners [${result.started.join(', ')}]` +
        (result.failed.length > 0 ? `, unavailable [${result.failed.join(', ')}]` : '') +
        `; LMD ${result.lmd.mode}.`);
}
// Run as a CLI when invoked directly (not when imported).
if (require.main === module) {
    void main().catch((err) => {
        console.error('fleet start: fatal error:', err instanceof Error ? err.message : err);
        process.exitCode = 1;
    });
}
//# sourceMappingURL=fleet-start.js.map

export { fleetStart as fleetStart, main as main };
