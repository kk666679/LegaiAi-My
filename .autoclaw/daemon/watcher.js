"use strict";
/**
 * watcher.ts — Chokidar-based inbox filesystem watcher.
 *
 * Replaces the previous sleep(30) polling loop with sub-second reactivity:
 * chokidar watches .autoclaw/orchestrator/comms/inboxes/ for file `add`
 * events and calls the registered message handler immediately.
 *
 * Graceful fallback: if chokidar fails to initialise (e.g. inotify watch
 * limit reached), a warning is logged and the watcher falls back to a 30-
 * second polling interval — it never crashes the extension.
 *
 * A3 — Part of Sprint-1 / WA-2 (Watchdog & Reconciliation).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInboxWatcher = createInboxWatcher;
const fs = require("fs");
const path = require("path");
const events_1 = require("events");
const fsPromises = fs.promises;
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
/** Snapshot of all .json files across all inboxes. Used by polling fallback. */
async function snapshotInboxFiles(inboxesDir) {
    const seen = new Set();
    let agents;
    try {
        agents = await fsPromises.readdir(inboxesDir);
    }
    catch {
        return seen;
    }
    for (const agent of agents) {
        const agentDir = path.join(inboxesDir, agent);
        try {
            const stat = await fsPromises.stat(agentDir);
            if (!stat.isDirectory()) {
                continue;
            }
            const files = await fsPromises.readdir(agentDir);
            for (const f of files) {
                if (f.endsWith('.json')) {
                    seen.add(path.join(agentDir, f));
                }
            }
        }
        catch { /* skip inaccessible */ }
    }
    return seen;
}
// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
/**
 * Create an InboxWatcher that uses chokidar for sub-second reactivity with
 * automatic fallback to polling if chokidar is unavailable.
 */
function createInboxWatcher(opts) {
    const { commsDir, onFileAdded, onFallback = (r) => console.warn('[autoclaw/watcher] Falling back to polling:', r), fallbackIntervalMs = 30000, } = opts;
    const inboxesDir = path.join(commsDir, 'inboxes');
    const emitter = new events_1.EventEmitter();
    let _isFallback = false;
    let _stopped = false;
    // Chokidar FSWatcher handle (set when chokidar initialises successfully).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let _chokidarWatcher = null;
    // Polling fallback timer handle.
    let _pollTimer = null;
    // Snapshot used to detect new files during polling.
    let _pollSnapshot = new Set();
    // ------------------------------------------------------------------
    // Polling fallback
    // ------------------------------------------------------------------
    function startPolling() {
        _isFallback = true;
        // Prime the initial snapshot so we only fire for *new* files.
        snapshotInboxFiles(inboxesDir).then(snap => {
            _pollSnapshot = snap;
        }).catch(() => { _pollSnapshot = new Set(); });
        _pollTimer = setInterval(async () => {
            if (_stopped) {
                return;
            }
            try {
                const current = await snapshotInboxFiles(inboxesDir);
                for (const filePath of current) {
                    if (!_pollSnapshot.has(filePath)) {
                        const agentId = path.basename(path.dirname(filePath));
                        emitter.emit('file-added', filePath, agentId);
                        onFileAdded(filePath, agentId);
                    }
                }
                _pollSnapshot = current;
            }
            catch { /* non-fatal */ }
        }, fallbackIntervalMs);
    }
    // ------------------------------------------------------------------
    // Public interface
    // ------------------------------------------------------------------
    async function start() {
        if (_stopped) {
            throw new Error('InboxWatcher has been stopped; create a new instance.');
        }
        // Ensure the inboxes directory exists before we watch it.
        await fsPromises.mkdir(inboxesDir, { recursive: true });
        try {
            // Dynamic require so the module can be unit-tested in environments where
            // chokidar is replaced with a mock via require.cache manipulation.
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const chokidar = require('chokidar');
            const watcher = chokidar.watch(inboxesDir, {
                persistent: true,
                ignoreInitial: true,
                // Watch for new inbox sub-dirs that may appear after startup.
                depth: 2,
                // Ignore the _state/ subdirectory (state machine files, not messages).
                ignored: ['**/_state/**', '**/_state'],
                awaitWriteFinish: {
                    stabilityThreshold: 80,
                    pollInterval: 50,
                },
            });
            watcher.on('add', (filePath) => {
                if (_stopped) {
                    return;
                }
                if (!filePath.endsWith('.json')) {
                    return;
                }
                const agentId = path.basename(path.dirname(filePath));
                emitter.emit('file-added', filePath, agentId);
                onFileAdded(filePath, agentId);
            });
            await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('chokidar ready timeout'));
                }, 10000);
                watcher.on('ready', () => {
                    clearTimeout(timeoutId);
                    resolve();
                });
                watcher.on('error', (err) => {
                    clearTimeout(timeoutId);
                    reject(err);
                });
            });
            // After 'ready', register the ongoing error handler for runtime errors.
            watcher.on('error', (err) => {
                emitter.emit('error', err);
                if (!_isFallback) {
                    onFallback(String(err));
                    startPolling();
                }
            });
            _chokidarWatcher = watcher;
            emitter.emit('started', { mode: 'chokidar' });
        }
        catch (err) {
            // Chokidar failed — start polling fallback.
            const reason = err instanceof Error ? err.message : String(err);
            onFallback(reason);
            startPolling();
            emitter.emit('started', { mode: 'polling' });
        }
    }
    async function stop() {
        _stopped = true;
        if (_pollTimer !== null) {
            clearInterval(_pollTimer);
            _pollTimer = null;
        }
        if (_chokidarWatcher !== null) {
            await _chokidarWatcher.close();
            _chokidarWatcher = null;
        }
        emitter.emit('stopped');
    }
    return {
        start,
        stop,
        get isFallback() { return _isFallback; },
        get events() { return emitter; },
    };
}
//# sourceMappingURL=watcher.js.map