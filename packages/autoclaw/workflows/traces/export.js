import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import * as ledger_1 from './ledger.js';
import * as types_1 from './types.js';

/**
 * export.ts — Trace dataset export for evals and opt-in distillation (TL-2).
 *
 * Turns filtered Trace Ledger episodes into a dataset the user can point an
 * eval harness or distillation pipeline at: one redacted JSONL file plus a
 * manifest carrying license/provenance fields.
 *
 * Contract points from the spec:
 *   - EXPLICIT USER ACTION: nothing exports on a timer or a hook. The API
 *     enforces it too — `confirm: true` is a required literal; its absence is
 *     an error result, not a default.
 *   - REDACTION ON BY DEFAULT: workspace-relative file paths become
 *     `f-<hash>.<ext>` tokens (stable within one export so "same file across
 *     episodes" is still learnable), the project name is scrubbed from every
 *     string, and secret-looking values go through the intelligence layer's
 *     redactSecrets. Trace rows are already prompt-free (TL-1 sanitizer);
 *     this pass removes the *identifying* residue.
 *   - MANIFEST: schema, dataset name, row count, filter, redaction settings,
 *     license, and provenance — so a dataset found on disk a year later says
 *     what it is and where it came from.
 */
Object.defineProperty(exports, "__esModule", { value: true });
export const TRACE_DATASET_SCHEMA = void 0;export const TRACE_DATASET_SCHEMA = 'autoclaw.traceDataset.v1';
/* -------------------------------------------------------------------------- */
/*  Redaction helpers                                                         */
/* -------------------------------------------------------------------------- */
/** Stable within one export: same path → same token, so cross-episode file
 *  identity survives redaction while the real name does not. */
function makePathToken() {
    const seen = new Map();
    return (p) => {
        const known = seen.get(p);
        if (known) {
            return known;
        }
        const ext = /\.[A-Za-z0-9]{1,8}$/.exec(p)?.[0] ?? '';
        const token = `f-${crypto.createHash('sha256').update(p).digest('hex').slice(0, 10)}${ext}`;
        seen.set(p, token);
        return token;
    };
}
/** Case-insensitive scrub of the project name from a string. */
function scrubProject(text, projectNames) {
    let out = text;
    for (const name of projectNames) {
        if (name.length < 3) {
            continue;
        }
        out = out.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'project');
    }
    return out;
}
/** Walk every string in the row through the scrubbers. */
function redactStrings(value, scrub) {
    if (typeof value === 'string') {
        return scrub(value);
    }
    if (Array.isArray(value)) {
        return value.map((v) => redactStrings(v, scrub));
    }
    if (value !== null && typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = redactStrings(v, scrub);
        }
        return out;
    }
    return value;
}
/* -------------------------------------------------------------------------- */
/*  exportTraces                                                              */
/* -------------------------------------------------------------------------- */
async function exportTraces(opts) {
    const warnings = [];
    if (opts.confirm !== true) {
        return { ok: false, error: 'export requires explicit confirmation (confirm: true)', exported: 0, warnings };
    }
    if (!opts.outDir) {
        return { ok: false, error: 'outDir is required — exports go where the user pointed', exported: 0, warnings };
    }
    const now = opts.now ?? new Date().toISOString();
    const name = (opts.name ?? 'autoclaw-traces').replace(/[^A-Za-z0-9._-]/g, '_');
    const redaction = {
        paths: opts.redaction?.paths ?? true,
        projectName: opts.redaction?.projectName ?? true,
        sessionIds: opts.redaction?.sessionIds ?? true,
    };
    // Read + filter.
    let rows = await (0, ledger_1.readTraces)(opts.workspaceRoot, {
        sinceIso: opts.filter?.sinceIso,
        agentId: opts.filter?.agentId,
        taskId: opts.filter?.taskId,
        limit: opts.filter?.limit ?? 10000,
    });
    if (typeof opts.filter?.minReward === 'number') {
        rows = rows.filter((r) => typeof r.reward === 'number' && r.reward >= opts.filter.minReward);
    }
    if (opts.filter?.outcome) {
        rows = rows.filter((r) => r.outcome === opts.filter.outcome);
    }
    // Redact.
    const pathToken = makePathToken();
    const projectNames = [path.basename(opts.workspaceRoot)];
    let redactSecretsFn = (s) => s;
    try {
        const { redactSecrets } = await import('../../intelligence/redact');
        redactSecretsFn = (s) => redactSecrets(s);
    }
    catch {
        warnings.push('secret redaction unavailable — exporting with path/name scrubbing only');
    }
    const scrub = (s) => {
        let out = redactSecretsFn(s);
        if (redaction.projectName) {
            out = scrubProject(out, projectNames);
        }
        return out;
    };
    const exportedRows = rows.map((row) => {
        const copy = JSON.parse(JSON.stringify(row));
        if (redaction.sessionIds) {
            delete copy.session_id;
            delete copy.session_label;
            delete copy.workspace;
        }
        if (redaction.paths && copy.changed_files) {
            copy.changed_files = copy.changed_files.map((f) => ({ ...f, path: pathToken(f.path) }));
        }
        return redactStrings(copy, scrub);
    });
    // Write dataset + manifest.
    const datasetPath = path.join(opts.outDir, `${name}.jsonl`);
    const manifestPath = path.join(opts.outDir, `${name}.manifest.json`);
    const manifest = {
        schema: exports.TRACE_DATASET_SCHEMA,
        name,
        created_at: now,
        rows: exportedRows.length,
        trace_schema: types_1.TRACE_SCHEMA,
        filter: { ...(opts.filter ?? {}) },
        redaction,
        license: opts.license ?? 'LicenseRef-Private-Internal-Eval-Only',
        provenance: {
            source: 'autoclaw-trace-ledger',
            exported_by: 'exportTraces',
            workspace: redaction.projectName ? 'project' : opts.workspaceRoot,
            ...(opts.notes ? { notes: opts.notes } : {}),
        },
    };
    try {
        await fs.promises.mkdir(opts.outDir, { recursive: true });
        await fs.promises.writeFile(datasetPath, exportedRows.map((r) => JSON.stringify(r)).join('\n') + (exportedRows.length ? '\n' : ''), 'utf8');
        await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    }
    catch (err) {
        return { ok: false, error: err.message, exported: 0, warnings };
    }
    return { ok: true, exported: exportedRows.length, datasetPath, manifestPath, warnings };
}
//# sourceMappingURL=export.js.map

export { exportTraces as exportTraces };
