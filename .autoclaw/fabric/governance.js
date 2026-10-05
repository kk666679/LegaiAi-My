"use strict";
/**
 * governance.ts — AF-5: org-level controls — an approval gate + an audit log.
 *
 * Two primitives:
 *  1. {@link gateDispatch} — decides whether an action by an agent of a given
 *     type needs human/governance approval before it takes effect. Human-in-loop
 *     types (assistant, governance) and any flow explicitly marked governance-
 *     controlled must be approved first.
 *  2. an append-only **audit log** every dispatch writes a row to, so an org can
 *     see who did what, when, and under which control. `vscode`-free; the file
 *     IO is small + append-only.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gateDispatch = gateDispatch;
exports.appendAuditLog = appendAuditLog;
exports.readAuditLog = readAuditLog;
const fs = require("fs");
const path = require("path");
const agentTypes_1 = require("./agentTypes");
const fsp = fs.promises;
/**
 * Decide whether an action may proceed without prior approval.
 *  - `governance` control level always needs approval (a governance actor signs off).
 *  - human-in-loop agent types (assistant, governance) need approval.
 *  - everything else proceeds (subject to the normal review gates downstream).
 */
function gateDispatch(agentType, controlLevel = 'individual') {
    if (controlLevel === 'governance') {
        return { allowed: false, needsApproval: true, reason: 'governance control level requires sign-off before dispatch' };
    }
    if ((0, agentTypes_1.requiresHumanApproval)(agentType)) {
        return { allowed: false, needsApproval: true, reason: `agent type '${agentType}' is human-in-the-loop` };
    }
    return { allowed: true, needsApproval: false, reason: 'no approval gate at this control level' };
}
function auditDir(autoclawDir) {
    return path.join(autoclawDir, 'orchestrator', 'audit');
}
function auditFileFor(autoclawDir, date) {
    const day = date.toISOString().slice(0, 10); // YYYY-MM-DD
    return path.join(auditDir(autoclawDir), `${day}.jsonl`);
}
/** Append one audit row. Best-effort timestamp defaults to now. */
async function appendAuditLog(autoclawDir, entry) {
    const now = entry.ts ? new Date(entry.ts) : new Date();
    const row = { ...entry, ts: entry.ts ?? now.toISOString() };
    const file = auditFileFor(autoclawDir, now);
    await fsp.mkdir(path.dirname(file), { recursive: true });
    await fsp.appendFile(file, JSON.stringify(row) + '\n', 'utf8');
}
/** Read all audit rows for a given day (default today). Tolerant of a missing file. */
async function readAuditLog(autoclawDir, date = new Date()) {
    let raw;
    try {
        raw = await fsp.readFile(auditFileFor(autoclawDir, date), 'utf8');
    }
    catch {
        return [];
    }
    const out = [];
    for (const line of raw.split(/\r?\n/)) {
        const t = line.trim();
        if (!t) {
            continue;
        }
        try {
            out.push(JSON.parse(t));
        }
        catch { /* skip malformed */ }
    }
    return out;
}
//# sourceMappingURL=governance.js.map