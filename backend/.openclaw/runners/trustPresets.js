"use strict";
/**
 * trustPresets.ts — `agents/<agent>/scope.json` trust-preset model (B5).
 *
 * RFC §3 (trust presets) and §4 (scope declaration) define a per-agent
 * `scope.json` that pins a {@link TrustPreset} (`off` | `auto` | `turbo`)
 * plus allow/deny tool lists and path/branch/budget scoping. `registry.ts`
 * already owns the *translation* of a preset into host-specific flags
 * (`translateTrust` / `TRUST_PRESET_TABLE`). This module owns the layer
 * *above* that: reading, validating, normalising and persisting the
 * `scope.json` document, and resolving the effective per-dispatch trust
 * for a runner — including how the allow/deny lists interact with the
 * preset's baseline auto-approval set.
 *
 * Why a separate module: the registry stays a pure flag-translation table
 * with no filesystem surface; this module is the one place that touches
 * `agents/<agent>/scope.json` on disk, so the I/O policy (deny-by-default,
 * tolerant of a missing/corrupt file) lives in exactly one spot.
 *
 * Sprint 3 — B5 (WA-3)
 *
 * @see docs/rfc/runner-bridge-contract.md §3, §4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCOPE_SCHEMA_VERSION = exports.STRICTEST_PRESET = exports.AUTO_BASELINE_TOOLS = exports.TRUST_PRESETS = void 0;
exports.isTrustPreset = isTrustPreset;
exports.validateScopeFile = validateScopeFile;
exports.defaultScopeFile = defaultScopeFile;
exports.scopeFilePath = scopeFilePath;
exports.readScopeFile = readScopeFile;
exports.writeScopeFile = writeScopeFile;
exports.resolveAutoApproved = resolveAutoApproved;
exports.resolveEffectiveTrust = resolveEffectiveTrust;
exports.isToolAutoApproved = isToolAutoApproved;
const fs = require("fs");
const path = require("path");
const registry_1 = require("./registry");
const fsPromises = fs.promises;
/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */
/** Valid trust presets, in stricter-to-looser order. */
exports.TRUST_PRESETS = ['off', 'auto', 'turbo'];
/**
 * Read-only tool categories an `auto` preset auto-approves by default
 * (RFC §3 — "read-only tools auto-approved: read, grep, ls, list-sessions").
 * A `scope.json` `trustAllowList` *adds* to this baseline; a `trustDenyList`
 * *removes* from it.
 */
exports.AUTO_BASELINE_TOOLS = [
    'read',
    'grep',
    'search',
    'ls',
    'list-sessions',
];
/** The strictest preset — used as the conservative fallback everywhere. */
exports.STRICTEST_PRESET = 'off';
/** Current `scope.json` schema version. */
exports.SCOPE_SCHEMA_VERSION = '1.0';
/* -------------------------------------------------------------------------- */
/*  Validation & normalisation                                                */
/* -------------------------------------------------------------------------- */
/** Type guard — a value is one of the three known trust presets. */
function isTrustPreset(v) {
    return v === 'off' || v === 'auto' || v === 'turbo';
}
/** Coerce an unknown value to a `string[]`, dropping non-strings. */
function toStringArray(v) {
    if (!Array.isArray(v)) {
        return undefined;
    }
    const out = v.filter((x) => typeof x === 'string').map(s => s.trim()).filter(Boolean);
    return out;
}
/**
 * Validate and normalise a parsed `scope.json` object.
 *
 * Deny-by-default: an absent or unparseable `trust` field is *not* silently
 * upgraded — the caller gets an error and should fall back to {@link STRICTEST_PRESET}
 * via {@link defaultScopeFile}. A bad allow/deny list is dropped (treated as
 * absent) rather than failing the whole document, since an empty list is a
 * safe interpretation.
 */
function validateScopeFile(raw, agentHint) {
    const errors = [];
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        return { ok: false, errors: ['scope.json must be a JSON object'] };
    }
    const obj = raw;
    const agent = typeof obj.agent === 'string' && obj.agent.trim()
        ? obj.agent.trim()
        : (agentHint ?? '');
    if (!agent) {
        errors.push('scope.json is missing the "agent" field');
    }
    if (!isTrustPreset(obj.trust)) {
        errors.push(`scope.json "trust" must be one of ${exports.TRUST_PRESETS.join(' | ')} (got ${JSON.stringify(obj.trust)})`);
    }
    // Numeric budgets, when present, must be positive finite numbers.
    for (const key of ['maxTokensPerDispatch', 'maxWallClockMs']) {
        if (obj[key] !== undefined) {
            const n = obj[key];
            if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) {
                errors.push(`scope.json "${key}" must be a positive number`);
            }
        }
    }
    if (errors.length > 0) {
        return { ok: false, errors };
    }
    const value = {
        agent,
        trust: obj.trust,
        schema_version: typeof obj.schema_version === 'string' ? obj.schema_version : exports.SCOPE_SCHEMA_VERSION,
    };
    const allow = toStringArray(obj.trustAllowList);
    if (allow) {
        value.trustAllowList = allow;
    }
    const deny = toStringArray(obj.trustDenyList);
    if (deny) {
        value.trustDenyList = deny;
    }
    const pathScope = toStringArray(obj.pathScope);
    if (pathScope) {
        value.pathScope = pathScope;
    }
    const branchScope = toStringArray(obj.branchScope);
    if (branchScope) {
        value.branchScope = branchScope;
    }
    if (typeof obj.browserAllowed === 'boolean') {
        value.browserAllowed = obj.browserAllowed;
    }
    if (typeof obj.maxTokensPerDispatch === 'number') {
        value.maxTokensPerDispatch = obj.maxTokensPerDispatch;
    }
    if (typeof obj.maxWallClockMs === 'number') {
        value.maxWallClockMs = obj.maxWallClockMs;
    }
    if (typeof obj.updated_at === 'string') {
        value.updated_at = obj.updated_at;
    }
    return { ok: true, value };
}
/**
 * The safe default `scope.json` for an agent with no file on disk:
 * the strictest preset, no allow list, no path scope.
 */
function defaultScopeFile(agent) {
    return {
        agent,
        trust: exports.STRICTEST_PRESET,
        schema_version: exports.SCOPE_SCHEMA_VERSION,
    };
}
/* -------------------------------------------------------------------------- */
/*  Filesystem I/O                                                            */
/* -------------------------------------------------------------------------- */
/** Absolute path to `agents/<agent>/scope.json` under an orchestrator dir. */
function scopeFilePath(orchestratorDir, agent) {
    return path.join(orchestratorDir, 'agents', path.basename(agent), 'scope.json');
}
/**
 * Read `agents/<agent>/scope.json`. Returns the normalised document, or the
 * {@link defaultScopeFile} (strictest preset) when the file is missing,
 * unreadable, or fails validation — never throws. `source` tells the caller
 * which path was taken so a corrupt file can be surfaced rather than masked.
 */
async function readScopeFile(orchestratorDir, agent) {
    const file = scopeFilePath(orchestratorDir, agent);
    let raw;
    try {
        raw = await fsPromises.readFile(file, 'utf8');
    }
    catch {
        return { scope: defaultScopeFile(agent), source: 'default' };
    }
    let parsed;
    try {
        parsed = JSON.parse(raw.replace(/^﻿/, ''));
    }
    catch {
        return {
            scope: defaultScopeFile(agent),
            source: 'default',
            errors: ['scope.json is not valid JSON'],
        };
    }
    const validation = validateScopeFile(parsed, agent);
    if (!validation.ok) {
        return { scope: defaultScopeFile(agent), source: 'default', errors: validation.errors };
    }
    return { scope: validation.value, source: 'file' };
}
/**
 * Persist `agents/<agent>/scope.json`. The document is validated first; an
 * invalid document is rejected (the orchestrator never writes a scope file
 * that would later read back as the strict default). `updated_at` and
 * `schema_version` are stamped on write.
 */
async function writeScopeFile(orchestratorDir, scope) {
    const validation = validateScopeFile(scope, scope.agent);
    if (!validation.ok) {
        return { ok: false, errors: validation.errors };
    }
    const doc = {
        ...validation.value,
        schema_version: exports.SCOPE_SCHEMA_VERSION,
        updated_at: new Date().toISOString(),
    };
    const file = scopeFilePath(orchestratorDir, scope.agent);
    await fsPromises.mkdir(path.dirname(file), { recursive: true });
    await fsPromises.writeFile(file, JSON.stringify(doc, null, 2) + '\n', 'utf8');
    return { ok: true, path: file };
}
/**
 * Resolve the auto-approved tool set for a preset + scope lists.
 *
 * - `off`   — nothing is auto-approved (every call prompts).
 * - `auto`  — {@link AUTO_BASELINE_TOOLS} ∪ `trustAllowList`, minus `trustDenyList`.
 * - `turbo` — everything auto-approved; the result is the *complement* model,
 *             so we return the allow list as informational and rely on
 *             `denied` to carry the only restriction. An empty `autoApproved`
 *             with `preset === 'turbo'` means "all except denied".
 *
 * The deny list always wins over the allow list (RFC §4).
 */
function resolveAutoApproved(scope) {
    const deny = new Set((scope.trustDenyList ?? []).map(s => s.trim()).filter(Boolean));
    const denied = [...deny];
    if (scope.trust === 'off') {
        return { autoApproved: [], denied };
    }
    if (scope.trust === 'turbo') {
        // turbo = allow-all-except-deny; autoApproved is left empty by convention.
        return { autoApproved: [], denied };
    }
    // auto: baseline ∪ allow-list, then subtract deny-list.
    const set = new Set(exports.AUTO_BASELINE_TOOLS);
    for (const t of scope.trustAllowList ?? []) {
        const trimmed = t.trim();
        if (trimmed) {
            set.add(trimmed);
        }
    }
    for (const d of deny) {
        set.delete(d);
    }
    return { autoApproved: [...set].sort(), denied };
}
/**
 * Resolve the effective trust for an (agent scope, runner) pair: combine the
 * registry's host-flag translation with the materialised allow/deny sets.
 *
 * This is the single call a dispatcher makes — it never needs to touch
 * `translateTrust` and `resolveAutoApproved` separately.
 */
function resolveEffectiveTrust(runnerId, scope) {
    const translation = (0, registry_1.translateTrust)(runnerId, scope.trust);
    const { autoApproved, denied } = resolveAutoApproved(scope);
    return {
        preset: scope.trust,
        translation,
        autoApproved,
        denied,
        downgraded: translation.downgradedFrom !== undefined,
    };
}
/**
 * Decide whether a single named tool category is auto-approved for a scope.
 *
 * - A tool on the deny list is never auto-approved (precedence rule).
 * - Under `turbo`, anything not denied is auto-approved.
 * - Under `auto`, only tools in the resolved {@link resolveAutoApproved} set.
 * - Under `off`, nothing is auto-approved.
 */
function isToolAutoApproved(scope, tool) {
    const name = tool.trim();
    if (!name) {
        return false;
    }
    const { autoApproved, denied } = resolveAutoApproved(scope);
    if (denied.includes(name)) {
        return false;
    }
    if (scope.trust === 'turbo') {
        return true;
    }
    if (scope.trust === 'off') {
        return false;
    }
    return autoApproved.includes(name);
}
//# sourceMappingURL=trustPresets.js.map