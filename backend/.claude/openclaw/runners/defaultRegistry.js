"use strict";
/**
 * defaultRegistry.ts — build a RunnerRegistry with every built-in platform
 * runner registered.
 *
 * The per-platform runners existed but nothing wired them together into a
 * registry the extension could use. This is that wiring — the entry point the
 * fabric onboarding command (and future routing) calls. Detection is NOT run
 * here; call `registry.detect()` afterwards.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILTIN_RUNNER_IDS = void 0;
exports.createDefaultRunnerRegistry = createDefaultRunnerRegistry;
const registry_1 = require("./registry");
const claude_code_1 = require("./claude-code");
const claude_desktop_1 = require("./claude-desktop");
const codex_1 = require("./codex");
const cursor_1 = require("./cursor");
const fable_1 = require("./fable");
const kiro_1 = require("./kiro");
const gemini_cli_1 = require("./gemini-cli");
const hermes_1 = require("./hermes");
const openclaw_1 = require("./openclaw");
const autogpt_1 = require("./autogpt");
const loop_service_adapter_1 = require("./loop-service-adapter");
/** The ids of every built-in platform runner, for menus + onboarding. */
exports.BUILTIN_RUNNER_IDS = [
    'claude-code', 'fable', 'claude-desktop', 'codex', 'cursor', 'kiro',
    'gemini-cli', 'hermes', 'openclaw', 'autogpt',
];
function createDefaultRunnerRegistry(opts = {}) {
    const reg = new registry_1.RunnerRegistry();
    reg.register(new claude_code_1.ClaudeCodeRunner());
    reg.register(new fable_1.FableRunner());
    reg.register(new claude_desktop_1.ClaudeDesktopRunner());
    reg.register(new codex_1.CodexRunner());
    reg.register(new cursor_1.CursorRunner());
    reg.register(new kiro_1.KiroRunner());
    reg.register(new gemini_cli_1.GeminiCliRunner());
    reg.register(new hermes_1.HermesRunner());
    reg.register(new openclaw_1.OpenClawRunner());
    reg.register(new autogpt_1.AutoGptRunner());
    for (const runner of (0, loop_service_adapter_1.loopServiceRunnersFromConfig)(opts.loopServices)) {
        reg.register(runner);
    }
    return reg;
}
//# sourceMappingURL=defaultRegistry.js.map