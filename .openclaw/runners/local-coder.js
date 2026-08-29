"use strict";
/**
 * `LocalCoderRunner` — worked example of the RFC §4 "thin runner +
 * local LLM" pattern.
 *
 * A `LoopServiceAdapter` subclass that uses its injected `LlmProvider`
 * to ask for a numbered plan preamble before submitting the prompt to
 * its loop service. The plan goes onto the dispatch body as `preamble`;
 * the loop service is free to include it in its prompt, log it, or
 * ignore it.
 *
 * Demonstrates two things:
 *   1. A runner can be just AutoClaw's tool surface + a local Ollama
 *      model — no cloud-CLI runner needed.
 *   2. The optional `provider?` field on `LoopServiceConfig` is enough
 *      to add LLM-aware behavior without re-implementing the dispatch
 *      lifecycle.
 *
 * @see docs/rfc/llm-provider-abstraction.md §4
 * @see docs/specs/llm-provider-s3/spec.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalCoderRunner = void 0;
const loop_service_adapter_1 = require("./loop-service-adapter");
/** How long to wait for the planning chat before falling through. */
const DEFAULT_PLAN_TIMEOUT_MS = 20000;
const DEFAULT_PLAN_PROMPT = 'Break the user task into 3-5 numbered steps. Output the numbered list and nothing else.';
class LocalCoderRunner extends loop_service_adapter_1.LoopServiceAdapter {
    constructor(config) {
        super(config);
        this.planPrompt = config.planPrompt ?? DEFAULT_PLAN_PROMPT;
        this.planTimeoutMs = config.planTimeoutMs ?? DEFAULT_PLAN_TIMEOUT_MS;
        this.planEnabled = config.planEnabled !== false;
    }
    /**
     * Override the async-body hook to ask the provider for a plan, and
     * inject it as `preamble` when the call succeeds. All failure modes
     * (no provider, provider errors, plan timeout, empty response) fall
     * through to the base body — the dispatch never fails because
     * planning did.
     */
    async augmentDispatchBody(body, opts) {
        if (!this.planEnabled || !this.provider)
            return body;
        try {
            const plan = await this.provider.chat({
                messages: [
                    { role: 'system', content: this.planPrompt },
                    { role: 'user', content: opts.prompt },
                ],
                hints: { intent: 'plan', requireLocality: 'local' },
                timeoutMs: this.planTimeoutMs,
                sessionId: opts.sessionId,
            });
            if (plan.ok && typeof plan.response === 'string' && plan.response.length > 0) {
                return { ...body, preamble: plan.response };
            }
        }
        catch {
            // Plan failure is non-fatal. Fall through to the base body.
        }
        return body;
    }
}
exports.LocalCoderRunner = LocalCoderRunner;
//# sourceMappingURL=local-coder.js.map