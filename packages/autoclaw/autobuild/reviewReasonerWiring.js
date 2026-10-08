// ZIPPY OPEN MATERIAL
//
// Wires a REAL `ReviewReasoner` (RA-3, src/orchestrator/reviewReasoner.ts) out
// of the Autopilot routing context + the LLM registry chat surface. This is
// the "call site" reviewReasoner.ts's own doc comment says wires the real
// model — until this module, `makeModelRouteReasoner` was only ever
// constructed in tests, so the Review Advisor ran flags-only in production
// regardless of the user's `autoclaw.autopilot.modelRoutes` configuration.
//
// Kept out of extension.ts (which is already large) and out of
// routesService.ts (which stays reasoner-agnostic — other Autopilot
// consumers, e.g. a future doc-writer or security-auditor call site, build
// their own thin wiring the same way).
//
// LOCAL-ONLY UNTIL RA-8: docs/specs/review-advisor/tasks.md's RA-4 entry
// explicitly defers "redaction-before-non-local-provider" to RA-8 ("only the
// local/flags path exists until the ZMLR/premium reasoners land"). The review
// prompt (reviewReasoner.ts buildReviewPrompt) includes task summary, file
// paths, and risk text — workspace content that must not leave the machine
// without the consent + redaction + gate RA-8 is scoped to build. This module
// is what first makes a non-local route *reachable* in production, so it
// enforces that boundary here: any route whose provider isn't local-hosted
// (Ollama etc.) declines to flags-only, same as an unconfigured route does.
export { chatFnFromRegistry as chatFnFromRegistry };
export { createRealReviewReasoner as createRealReviewReasoner };
import routesService_1 from "./routesService.js";
import reviewReasoner_1 from "../orchestrator/reviewReasoner";
/**
 * Adapt an `LlmRegistry`-shaped chat function into the reasoner's
 * `ReasonerChatFn`. Routes explicitly to `route.provider`; the registry falls
 * back to its own preference order if that provider id isn't registered
 * (e.g. a route naming a provider the user hasn't configured), so a stale or
 * mistyped tier entry degrades to *some* answer rather than silently
 * skipping the reasoner. A failed/malformed call returns null — the caller
 * (reviewReasoner) already treats that as "decline → flags-only".
 *
 * Declines non-local routes outright — see the module-level "LOCAL-ONLY UNTIL
 * RA-8" note. This check belongs here (not only in `createRealReviewReasoner`)
 * so it holds even if a future caller wires `chatFnFromRegistry` directly.
 */
function chatFnFromRegistry(registry) {
    return async (prompt, route) => {
        if (!(0, routesService.isLocalProvider)(route.provider)) {
            return null;
        }
        try {
            const result = await registry.chat({ prompt, model: route.model, jsonMode: true, timeoutMs: 20000 }, route.provider);
            return result.ok && typeof result.response === 'string' ? result.response : null;
        }
        catch {
            return null;
        }
    };
}
/**
 * Build a production `ReviewReasoner`: resolves the `'review'` task class
 * through the full Autopilot ladder (premium learned routing → ZMLR → the
 * user's static tiers → fallback → host default, with live local-provider
 * discovery) and calls the LLM registry for the actual completion. Pass the
 * result as `BuildAdvisoryOptions.reasoner`.
 */
function createRealReviewReasoner(opts) {
    const chat = chatFnFromRegistry(opts.registry);
    return {
        async reason(input) {
            // Re-derive the routing context per call (cheap: config read + a live
            // Ollama probe) so a mid-session settings change or newly-pulled model
            // takes effect on the next advisory without an extension reload.
            const { config, delegates } = await (0, routesService.buildRoutingContext)(opts);
            return (0, reviewReasoner.makeModelRouteReasoner)({ chat, config, delegates }).reason(input);
        },
    };
}
//# sourceMappingURL=reviewReasonerWiring.js.map
