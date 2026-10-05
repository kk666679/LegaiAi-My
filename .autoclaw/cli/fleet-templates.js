"use strict";
/**
 * fleet-templates.ts — Quick-config fleet templates + VS Code "Start Fleet"
 * command (H2).
 *
 * Two responsibilities:
 *
 *   1. Quick-config templates — three ready-made fleet configurations,
 *      materialised on demand into `.autoclaw/templates/`:
 *        • solo-sprint.yaml   — one runner, no remote agents (fast local loop)
 *        • full-fleet.yaml    — every known runner + LMD monitoring
 *        • voidspec-sync.yaml — full fleet with a `.voidspec/` watcher enabled
 *
 *   2. {@link startFleetCommand} — the function the VS Code command
 *      `AutoClaw: Start Fleet` invokes. It picks (or asks for) a template,
 *      writes the registry, and boots the fleet via {@link fleetStart}. It is
 *      registered as `autoclaw.fleet.start` in `src/extension.ts` `activate()`.
 *
 * Pure file-I/O + orchestration. *** NO LLM CALLS. ***
 *
 * H2 — Sprint-3 / WA-4 (Fleet VS Code command + templates).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FLEET_TEMPLATE_ORDER = exports.FLEET_TEMPLATES = void 0;
exports.templateToYaml = templateToYaml;
exports.parseTemplateYaml = parseTemplateYaml;
exports.templatesDir = templatesDir;
exports.writeFleetTemplates = writeFleetTemplates;
exports.loadFleetTemplate = loadFleetTemplate;
exports.buildTemplatePickItems = buildTemplatePickItems;
exports.shouldShowTemplatePicker = shouldShowTemplatePicker;
exports.applyTemplateToRegistry = applyTemplateToRegistry;
exports.startFleetCommand = startFleetCommand;
const fs = require("fs");
const path = require("path");
const fleet_start_1 = require("./fleet-start");
/** Every built-in template, in picker display order. */
exports.FLEET_TEMPLATES = {
    'solo-sprint': {
        id: 'solo-sprint',
        label: 'Solo Sprint',
        description: 'One runner, no remote agents — fastest local edit loop.',
        runners: ['claude-code'],
        lmd: false,
        voidspecWatch: false,
    },
    'full-fleet': {
        id: 'full-fleet',
        label: 'Full Fleet',
        description: 'Every known runner plus LMD health monitoring.',
        runners: ['codex', 'hermes', 'openclaw'],
        lmd: true,
        voidspecWatch: false,
    },
    'voidspec-sync': {
        id: 'voidspec-sync',
        label: 'VoidSpec Sync',
        description: 'Full fleet with a .voidspec/ watcher for spec-driven work.',
        runners: ['codex', 'hermes', 'openclaw'],
        lmd: true,
        voidspecWatch: true,
    },
};
/** Ordered list of template ids, for picker UIs. */
exports.FLEET_TEMPLATE_ORDER = [
    'solo-sprint',
    'full-fleet',
    'voidspec-sync',
];
// ---------------------------------------------------------------------------
// Template YAML serialisation
// ---------------------------------------------------------------------------
/** Serialise a {@link FleetTemplate} to a small YAML document. */
function templateToYaml(t) {
    const lines = [];
    lines.push(`# AutoClaw fleet quick-config template: ${t.label}`);
    lines.push(`# ${t.description}`);
    lines.push(`id: ${t.id}`);
    lines.push(`label: "${t.label}"`);
    lines.push(`description: "${t.description}"`);
    lines.push(`runners: [${t.runners.join(', ')}]`);
    lines.push(`lmd: ${t.lmd}`);
    lines.push(`voidspec_watch: ${t.voidspecWatch}`);
    lines.push('');
    return lines.join('\n');
}
/**
 * Parse a fleet template YAML document back into a {@link FleetTemplate}.
 * Best-effort, no external YAML library — same approach as the orchestrator.
 */
function parseTemplateYaml(content) {
    const text = content.replace(/^﻿/, '');
    const scalar = (key) => {
        const m = text.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
        if (!m) {
            return undefined;
        }
        return m[1].trim().replace(/^["']|["']$/g, '');
    };
    const bool = (key) => (scalar(key) ?? 'false').toLowerCase() === 'true';
    const list = (key) => {
        const raw = scalar(key);
        if (!raw) {
            return [];
        }
        const inner = raw.startsWith('[') && raw.endsWith(']')
            ? raw.slice(1, -1)
            : raw;
        return inner.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    };
    const id = scalar('id');
    if (!id) {
        return null;
    }
    return {
        id,
        label: scalar('label') ?? id,
        description: scalar('description') ?? '',
        runners: list('runners'),
        lmd: bool('lmd'),
        voidspecWatch: bool('voidspec_watch'),
    };
}
// ---------------------------------------------------------------------------
// Template materialisation
// ---------------------------------------------------------------------------
/** Resolve the absolute path to a workspace's `.autoclaw/templates/` dir. */
function templatesDir(workspaceRoot) {
    return path.join(workspaceRoot, '.autoclaw', 'templates');
}
/**
 * Write all built-in templates into `.autoclaw/templates/`.
 *
 * Idempotent: a template file whose content is byte-for-byte identical is not
 * rewritten. Returns the absolute paths of files that were created or updated.
 */
function writeFleetTemplates(workspaceRoot) {
    const dir = templatesDir(workspaceRoot);
    fs.mkdirSync(dir, { recursive: true });
    const changed = [];
    for (const id of exports.FLEET_TEMPLATE_ORDER) {
        const filePath = path.join(dir, `${id}.yaml`);
        const yaml = templateToYaml(exports.FLEET_TEMPLATES[id]);
        let existing = '';
        try {
            existing = fs.readFileSync(filePath, 'utf8');
        }
        catch { /* none */ }
        if (existing !== yaml) {
            fs.writeFileSync(filePath, yaml, 'utf8');
            changed.push(filePath);
        }
    }
    return changed;
}
/**
 * Load a fleet template by id from `.autoclaw/templates/`. Falls back to the
 * built-in definition when the file is absent or unparseable.
 */
function loadFleetTemplate(workspaceRoot, id) {
    const filePath = path.join(templatesDir(workspaceRoot), `${id}.yaml`);
    try {
        const parsed = parseTemplateYaml(fs.readFileSync(filePath, 'utf8'));
        if (parsed) {
            return parsed;
        }
    }
    catch { /* fall through to built-in */ }
    return exports.FLEET_TEMPLATES[id];
}
/**
 * Build the quick-pick item list for the template picker UI.
 *
 * This is host-agnostic: it returns plain data the extension feeds straight
 * into `vscode.window.showQuickPick`. Keeping it here makes it unit-testable
 * without a VS Code host.
 */
function buildTemplatePickItems() {
    return exports.FLEET_TEMPLATE_ORDER.map((id) => {
        const t = exports.FLEET_TEMPLATES[id];
        return { id, label: t.label, detail: t.description };
    });
}
/**
 * Decide whether the template picker should be shown on this run.
 *
 * The picker is "first-run" UX: it shows when no fleet registry exists yet.
 * Once `.autoclaw/program/registry.json` has been written the picker is
 * skipped and the existing registry is reused.
 */
function shouldShowTemplatePicker(workspaceRoot) {
    const registry = path.join(workspaceRoot, '.autoclaw', 'program', 'registry.json');
    return !fs.existsSync(registry);
}
// ---------------------------------------------------------------------------
// Registry materialisation
// ---------------------------------------------------------------------------
/**
 * Write `.autoclaw/program/registry.json` from a template's runner list so a
 * subsequent {@link fleetStart} boots exactly the template's runners.
 * Returns the absolute path of the registry file.
 */
function applyTemplateToRegistry(workspaceRoot, template) {
    const dir = path.join(workspaceRoot, '.autoclaw', 'program');
    fs.mkdirSync(dir, { recursive: true });
    const registryPath = path.join(dir, 'registry.json');
    const payload = JSON.stringify({
        runners: template.runners,
        // Provenance — which template produced this registry.
        _source_template: template.id,
    }, null, 2);
    fs.writeFileSync(registryPath, payload + '\n', 'utf8');
    return registryPath;
}
/**
 * Implementation of the `AutoClaw: Start Fleet` VS Code command.
 *
 * Flow:
 *   1. Ensure the three built-in templates exist under `.autoclaw/templates/`.
 *   2. Resolve the template: explicit `templateId`, else (first run) show the
 *      picker, else default to `full-fleet`.
 *   3. Write `.autoclaw/program/registry.json` from the template.
 *   4. Boot the fleet via {@link fleetStart} (skipped when `dryRun`).
 *
 * No `vscode` import — fully unit-testable. The extension host wraps it.
 *
 * WIRED: contributed as `autoclaw.fleet.start` ("AutoClaw: Start Fleet") in
 * `package.json#contributes.commands` and registered in `src/extension.ts`
 * `activate()`, which supplies a `pickTemplate` backed by
 * `vscode.window.showQuickPick` and surfaces {@link StartFleetCommandResult.summary}.
 */
async function startFleetCommand(opts) {
    const logger = opts.logger ?? console;
    // 1. Materialise built-in templates.
    const written = writeFleetTemplates(opts.workspaceRoot);
    if (written.length > 0) {
        logger.info(`fleet: wrote ${written.length} template file(s).`);
    }
    // 2. Resolve which template to use.
    let templateId = opts.templateId ?? null;
    if (templateId === null) {
        if (shouldShowTemplatePicker(opts.workspaceRoot) && opts.pickTemplate) {
            templateId = await opts.pickTemplate(buildTemplatePickItems());
            if (templateId === null) {
                return { started: false, summary: 'Start Fleet cancelled.' };
            }
        }
        else {
            // Not first run, or no picker supplied — default to the full fleet.
            templateId = 'full-fleet';
        }
    }
    const template = loadFleetTemplate(opts.workspaceRoot, templateId);
    // 3. Write the registry so fleetStart boots exactly this template.
    const registryPath = applyTemplateToRegistry(opts.workspaceRoot, template);
    logger.info(`fleet: registry written → ${registryPath}`);
    // 4. Boot the fleet (unless dry-run).
    if (opts.dryRun) {
        return {
            started: true,
            template,
            summary: `Fleet template "${template.label}" prepared (dry run) — ` +
                `runners [${template.runners.join(', ')}].`,
        };
    }
    let fleet;
    try {
        fleet = await (0, fleet_start_1.fleetStart)({
            workspaceRoot: opts.workspaceRoot,
            skipLmd: !template.lmd,
            logger,
        });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`fleet: start failed — ${msg}`);
        return {
            started: false,
            template,
            summary: `Start Fleet failed: ${msg}`,
        };
    }
    const summary = `Fleet "${template.label}" started — ` +
        `${fleet.started.length} runner(s) up` +
        (fleet.failed.length > 0 ? `, ${fleet.failed.length} unavailable` : '') +
        `; LMD ${fleet.lmd.running ? fleet.lmd.mode : 'off'}` +
        (template.voidspecWatch ? '; VoidSpec watch enabled' : '') +
        '.';
    return { started: true, template, fleet, summary };
}
//# sourceMappingURL=fleet-templates.js.map