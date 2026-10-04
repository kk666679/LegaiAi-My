"use strict";
/**
 * fable.ts — Claude-backed Fable runner alias.
 *
 * Fable is not a separate transport in AutoClaw. It is a specialized Claude
 * agent profile selected through the existing Claude Code runner. Registering it
 * as its own runner id lets orchestration address `fable` directly while keeping
 * all Claude auth, session, MCP, trust, and cancellation behavior in one place.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FableRunner = exports.FABLE_AGENT_PROFILE = void 0;
const claude_code_1 = require("./claude-code");
exports.FABLE_AGENT_PROFILE = 'fable';
class FableRunner {
    constructor(transport) {
        this.id = 'fable';
        this.delegate = new claude_code_1.ClaudeCodeRunner(transport);
        this.capabilities = this.delegate.capabilities;
    }
    detect() {
        return this.delegate.detect();
    }
    dispatch(opts) {
        return this.delegate.dispatch({
            ...opts,
            agentProfile: opts.agentProfile ?? exports.FABLE_AGENT_PROFILE,
        });
    }
    resume(sessionId, prompt, opts) {
        return this.delegate.resume(sessionId, prompt, {
            ...opts,
            agentProfile: opts?.agentProfile ?? exports.FABLE_AGENT_PROFILE,
        });
    }
    listSessions() {
        return this.delegate.listSessions();
    }
    health() {
        return this.delegate.health();
    }
    cancel(sessionId) {
        return this.delegate.cancel(sessionId);
    }
}
exports.FableRunner = FableRunner;
//# sourceMappingURL=fable.js.map