"use strict";
/**
 * Public surface of the AutoClaw runner contract.
 *
 * Per-vendor runner adapters and the orchestrator import from here rather
 * than reaching into individual modules.
 *
 * @see docs/rfc/runner-bridge-contract.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalCoderRunner = exports.FABLE_AGENT_PROFILE = exports.FableRunner = exports.trustToPermissionMode = exports.CliHeadlessTransport = exports.ClaudeCodeRunner = exports.dispatchViaRegistry = exports.BUILTIN_RUNNER_IDS = exports.createDefaultRunnerRegistry = exports.translateTrust = exports.TRUST_PRESET_TABLE = exports.RunnerRegistry = void 0;
var registry_1 = require("./registry");
Object.defineProperty(exports, "RunnerRegistry", { enumerable: true, get: function () { return registry_1.RunnerRegistry; } });
Object.defineProperty(exports, "TRUST_PRESET_TABLE", { enumerable: true, get: function () { return registry_1.TRUST_PRESET_TABLE; } });
Object.defineProperty(exports, "translateTrust", { enumerable: true, get: function () { return registry_1.translateTrust; } });
var defaultRegistry_1 = require("./defaultRegistry");
Object.defineProperty(exports, "createDefaultRunnerRegistry", { enumerable: true, get: function () { return defaultRegistry_1.createDefaultRunnerRegistry; } });
Object.defineProperty(exports, "BUILTIN_RUNNER_IDS", { enumerable: true, get: function () { return defaultRegistry_1.BUILTIN_RUNNER_IDS; } });
var dispatchViaRegistry_1 = require("./dispatchViaRegistry");
Object.defineProperty(exports, "dispatchViaRegistry", { enumerable: true, get: function () { return dispatchViaRegistry_1.dispatchViaRegistry; } });
var claude_code_1 = require("./claude-code");
Object.defineProperty(exports, "ClaudeCodeRunner", { enumerable: true, get: function () { return claude_code_1.ClaudeCodeRunner; } });
Object.defineProperty(exports, "CliHeadlessTransport", { enumerable: true, get: function () { return claude_code_1.CliHeadlessTransport; } });
Object.defineProperty(exports, "trustToPermissionMode", { enumerable: true, get: function () { return claude_code_1.trustToPermissionMode; } });
var fable_1 = require("./fable");
Object.defineProperty(exports, "FableRunner", { enumerable: true, get: function () { return fable_1.FableRunner; } });
Object.defineProperty(exports, "FABLE_AGENT_PROFILE", { enumerable: true, get: function () { return fable_1.FABLE_AGENT_PROFILE; } });
var local_coder_1 = require("./local-coder");
Object.defineProperty(exports, "LocalCoderRunner", { enumerable: true, get: function () { return local_coder_1.LocalCoderRunner; } });
//# sourceMappingURL=index.js.map