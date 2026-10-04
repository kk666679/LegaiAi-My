"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchViaRegistry = dispatchViaRegistry;
/**
 * Select a runner from the registry and dispatch one unit of work through the
 * runner contract. Returns `null` (no throw) when no runner can be selected —
 * e.g. an unknown/disabled explicit id, or no runner detected for the
 * preference order. Selection runs `registry.detect()` first so enablement /
 * detection state is fresh.
 */
async function dispatchViaRegistry(registry, opts) {
    await registry.detect();
    let runner = null;
    if (opts.runnerId) {
        const entry = registry.get(opts.runnerId);
        runner = entry && entry.enabled ? entry.runner : null;
    }
    else {
        runner = registry.getPreferred(opts.preference ?? {});
    }
    if (!runner) {
        return null;
    }
    const result = await runner.dispatch({
        prompt: opts.prompt,
        trust: opts.trust ?? 'auto',
        workingDir: opts.workingDir,
        sessionId: opts.sessionId,
    });
    if (opts.onResult) {
        try {
            await opts.onResult(runner.id, result);
        }
        catch {
            /* best-effort — cost/telemetry sink must never break a dispatch */
        }
    }
    return { result, runnerId: runner.id };
}
//# sourceMappingURL=dispatchViaRegistry.js.map