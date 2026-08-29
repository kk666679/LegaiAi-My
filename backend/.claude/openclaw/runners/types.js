"use strict";
/**
 * Runner / Bridge contract types.
 *
 * Implements the type surface of `docs/rfc/runner-bridge-contract.md`
 * (§2 Runner interface, §3 Trust presets, §4 Scope declaration,
 * §7 Health and exit codes).
 *
 * A **Runner** is anything that takes a prompt and turns it into work
 * without a human-typed chat message. Per-vendor adapters (claude-code,
 * cursor, kiro, gemini-cli) implement the {@link Runner} interface; the
 * orchestrator only ever speaks this contract.
 *
 * This module is the keystone for Workstream B — it contains types only,
 * no runtime logic, so downstream tasks can branch off it without churn.
 *
 * @see docs/rfc/runner-bridge-contract.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=types.js.map