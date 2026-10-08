import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * heartbeat.ts — Session-level heartbeat writer for the AutoClaw comms layer.
 *
 * Extends the primary `writeHeartbeat` / `readHeartbeat` in comms.ts by also
 * writing a per-session file so the panel can show per-session rows.
 *
 * File layout:
 *   <commsDir>/heartbeats/
 *     <agent_id>.json                   ← primary (always written)
 *     <agent_id>-<session_id>.json      ← session-level (written when session_id present)
 *
 * Stall detection:
 *   - The primary file is the authoritative stall signal (checked by
 *     `agentStatusFromHeartbeat` in comms.ts).
 *   - `readSessionHeartbeats` returns all `<agent_id>-*.json` session files so
 *     the panel can render per-session last-seen times.
 *
 * Sprint 1 — A5 (WA-3)
 */
Object.defineProperty(exports, "__esModule", { value: true });

const fsPromises = fs.promises;
// ---------------------------------------------------------------------------
// Session heartbeat writer
// ---------------------------------------------------------------------------
/**
 * Write the primary heartbeat (`<agent_id>.json`) AND, when `session_id` is
 * present, a session-level sidecar file (`<agent_id>-<session_id>.json`).
 *
 * The primary file is always overwritten (latest wins).  The session file is
 * written alongside and retains the full heartbeat payload so the panel can
 * show per-session details without re-reading the primary.
 */
async function writeSessionHeartbeat(commsDir, hb) {
    const dir = path.join(commsDir, 'heartbeats');
    await fsPromises.mkdir(dir, { recursive: true });
    const agentBase = path.basename(hb.agent_id);
    const primaryPath = path.join(dir, `${agentBase}.json`);
    const payload = JSON.stringify(hb, null, 2);
    await fsPromises.writeFile(primaryPath, payload, 'utf8');
    let sessionPath = null;
    if (hb.session_id) {
        // Sanitise session_id to be safe as a filename component.
        const safeSession = hb.session_id.replace(/[^A-Za-z0-9_-]/g, '_');
        sessionPath = path.join(dir, `${agentBase}-${safeSession}.json`);
        await fsPromises.writeFile(sessionPath, payload, 'utf8');
    }
    return { primaryPath, sessionPath };
}
// ---------------------------------------------------------------------------
// Session heartbeat reader
// ---------------------------------------------------------------------------
/**
 * Read all session-level heartbeat files for a given agent.
 *
 * Looks for files matching `<agent_id>-*.json` in the heartbeats directory.
 * Excludes the primary file (`<agent_id>.json`).
 *
 * Returns an empty array when the heartbeats directory does not exist or when
 * no session files are present.
 */
async function readSessionHeartbeats(commsDir, agentId) {
    const dir = path.join(commsDir, 'heartbeats');
    try {
        const files = await fsPromises.readdir(dir);
        const agentBase = path.basename(agentId);
        const sessionFiles = files.filter(f => f.startsWith(`${agentBase}-`) && f.endsWith('.json'));
        const results = [];
        for (const f of sessionFiles) {
            try {
                const raw = await fsPromises.readFile(path.join(dir, f), 'utf8');
                results.push(JSON.parse(raw.replace(/^﻿/, '')));
            }
            catch {
                /* skip malformed */
            }
        }
        return results;
    }
    catch {
        return [];
    }
}
// ---------------------------------------------------------------------------
// Real Claude Code transcript resolution
// ---------------------------------------------------------------------------
/**
 * Encode a workspace root the way the Claude Code CLI names its
 * `~/.claude/projects/<encoded>/` transcript directory: every character that
 * isn't alphanumeric becomes a literal `-` (no collapsing of runs).
 */
function encodeClaudeProjectDir(workspaceRoot) {
    return workspaceRoot.replace(/[^A-Za-z0-9]/g, '-');
}
/**
 * Best-effort lookup of the REAL Claude Code session id + transcript path for
 * this workspace, nearest to a given heartbeat timestamp.
 *
 * A session row's `session_id` is a per-extension-activation UUID stamped for
 * cross-agent coordination (mailboxes, claims) — it was never a resumable
 * Claude Code chat session id, so passing it to the
 * `vscode://anthropic.claude-code/open?session=` deep link always misses and
 * opens a fresh conversation instead of the intended one. The actual
 * resumable id is the `.jsonl` transcript's filename under
 * `~/.claude/projects/<encoded-cwd>/`. Returns undefined (never throws) when
 * no transcript store or match is found, so callers can fall back to prior
 * behaviour.
 */
async function resolveClaudeCodeTranscript(workspaceRoot, nearTimestampMs) {
    try {
        const projectDir = path.join(os.homedir(), '.claude', 'projects', encodeClaudeProjectDir(workspaceRoot));
        const files = await fsPromises.readdir(projectDir);
        let best;
        for (const file of files) {
            if (!file.endsWith('.jsonl')) {
                continue;
            }
            const rawRef = path.join(projectDir, file);
            try {
                const stat = await fsPromises.stat(rawRef);
                const delta = Math.abs(stat.mtimeMs - nearTimestampMs);
                if (!best || delta < best.delta) {
                    best = { sessionId: file.slice(0, -'.jsonl'.length), rawRef, delta };
                }
            }
            catch {
                /* unreadable transcript — skip */
            }
        }
        return best ? { sessionId: best.sessionId, rawRef: best.rawRef } : undefined;
    }
    catch {
        return undefined;
    }
}
// ---------------------------------------------------------------------------
// Stall detection helper
// ---------------------------------------------------------------------------
/**
 * Returns true when the agent is considered stalled based on its primary
 * heartbeat AND all session-level files.
 *
 * An agent is stalled when:
 *   - Its primary heartbeat is older than `stallThresholdMs` (default 5 min).
 *   - It has an active sprint assignment at the time of that heartbeat.
 *
 * Individual session files are returned so the panel can render per-session
 * last-seen times — this function only checks the primary for the stall
 * signal (consistent with `agentStatusFromHeartbeat` in comms.ts).
 */
async function checkStall(commsDir, agentId, options = {}) {
    const stallThresholdMs = options.stallThresholdMs ?? 5 * 60 * 1000;
    const now = options.now ?? Date.now();
    // Read primary heartbeat.
    let primaryAge = null;
    let stalled = false;
    try {
        const raw = await fsPromises.readFile(path.join(commsDir, 'heartbeats', `${path.basename(agentId)}.json`), 'utf8');
        const hb = JSON.parse(raw.replace(/^﻿/, ''));
        primaryAge = now - new Date(hb.timestamp).getTime();
        stalled = primaryAge >= stallThresholdMs && hb.sprint !== null && hb.sprint !== undefined;
    }
    catch {
        /* primary missing → offline, not stalled */
    }
    // Read session heartbeats.
    const sessionHbs = await readSessionHeartbeats(commsDir, agentId);
    const sessions = sessionHbs.map(hb => ({
        session_id: hb.session_id,
        last_seen: hb.timestamp,
        age: now - new Date(hb.timestamp).getTime(),
    }));
    return { stalled, primaryAge, sessions };
}
//# sourceMappingURL=heartbeat.js.map

export { writeSessionHeartbeat as writeSessionHeartbeat, readSessionHeartbeats as readSessionHeartbeats, resolveClaudeCodeTranscript as resolveClaudeCodeTranscript, checkStall as checkStall };
