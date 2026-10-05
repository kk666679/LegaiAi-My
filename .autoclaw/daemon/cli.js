#!/usr/bin/env node
"use strict";
/**
 * daemon/cli.ts — the `autoclawd` executable (CP-3.1). Starts the headless
 * daemon and keeps the process alive until SIGINT/SIGTERM, then tears it down
 * cleanly. Wired as `bin.autoclawd` → `out/daemon/cli.js` in package.json, so
 * `npx autoclawd` / a global install runs the fleet with no IDE open.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const autoclawd_1 = require("./autoclawd");
async function main() {
    const nv = (0, autoclawd_1.checkNodeVersion)();
    if (!nv.ok) {
        console.warn(`[autoclawd] ${nv.message}`);
    }
    const handle = await (0, autoclawd_1.startAutoclawd)({ workspaceRoot: process.argv[2] });
    let shuttingDown = false;
    const shutdown = async (sig) => {
        if (shuttingDown) {
            return;
        }
        shuttingDown = true;
        console.log(`[autoclawd] ${sig} — shutting down`);
        await handle.stop();
        process.exit(0);
    };
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    console.log(`[autoclawd] running on ${handle.config.workspaceRoot} — Ctrl-C to stop`);
}
main().catch((e) => {
    console.error('[autoclawd] fatal:', e instanceof Error ? e.message : String(e));
    process.exit(1);
});
//# sourceMappingURL=cli.js.map