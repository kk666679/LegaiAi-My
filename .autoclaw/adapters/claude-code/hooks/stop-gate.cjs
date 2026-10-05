#!/usr/bin/env node
'use strict';
/**
 * stop-gate.cjs — Claude Code Stop hook enforcing AutoClaw protocol rule 7.
 *
 * Blocks a Claude Code session from stopping when THIS session has broadcast
 * a `task_complete` whose handoff-note sidecar is missing on disk, or holds a
 * claim in comms/claims/ with no heartbeat file for the owning agent.
 *
 * Protocol (Claude Code Stop hook):
 *   stdin:  JSON {"session_id", "transcript_path", "stop_hook_active", "cwd"?}
 *   exit 0: allow the stop.
 *   exit 2: block the stop; stderr is fed back to Claude as the reason.
 *
 * Guarantees:
 *   - ONE-NUDGE YIELD: when stop_hook_active is true (Claude is already
 *     continuing because of a Stop hook) this script always exits 0, so it
 *     can never loop a session forever.
 *   - ABSOLUTE FAIL-OPEN: any error anywhere -> exit 0. A broken comms tree,
 *     malformed stdin, or missing build must never trap a session.
 *   - ZERO DEPENDENCIES: node:fs + node:path only. Prefers the compiled gate
 *     (out/orchestrator/stopGate.js — the tested implementation); falls back
 *     to the minimal inline port below when no build is present.
 *   - SESSION-ID MAPPING: Claude Code's hook session_id (transcript session)
 *     is not guaranteed to equal the agent-protocol session UUID stamped on
 *     messages. When the raw id matches NOTHING in the comms tree, the gate
 *     reads the agent's own heartbeat (comms/heartbeats/<agent>.json, agent
 *     id from AUTOCLAW_AGENT_ID, default claude-code) and scans as its
 *     session_id instead — but only when that heartbeat is FRESH (~2h).
 *     A stale/missing heartbeat keeps the raw id (fail-open, old behavior).
 *   - Kill switch: AUTOCLAW_STOP_GATE=0 disables the gate entirely.
 *
 * Registration: see README.md next to this file.
 */

const fs = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

function main() {
  if (process.env.AUTOCLAW_STOP_GATE === '0') { return 0; }

  let input = {};
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return 0; // unreadable stdin -> fail open
  }
  if (!input || typeof input !== 'object') { return 0; }

  // One-nudge yield: never block twice for the same stop.
  if (input.stop_hook_active === true) { return 0; }

  const sessionId = typeof input.session_id === 'string' ? input.session_id : '';
  if (!sessionId) { return 0; }

  const workspaceRoot = resolveWorkspaceRoot(input);
  if (!workspaceRoot) { return 0; }

  const agentId = typeof process.env.AUTOCLAW_AGENT_ID === 'string' && process.env.AUTOCLAW_AGENT_ID !== ''
    ? process.env.AUTOCLAW_AGENT_ID
    : 'claude-code';

  const evaluate = loadCompiledGate(workspaceRoot) || evaluateInline;
  const decision = evaluate({ workspaceRoot, sessionId, stopHookActive: false, agentId });

  if (decision && decision.block === true && typeof decision.reason === 'string') {
    process.stderr.write(decision.reason + '\n');
    return 2;
  }
  return 0;
}

function resolveWorkspaceRoot(input) {
  const candidates = [input.cwd, process.env.CLAUDE_PROJECT_DIR, process.cwd()];
  for (const c of candidates) {
    try {
      if (typeof c === 'string' && c !== '' && fs.existsSync(c)) { return c; }
    } catch { /* keep trying */ }
  }
  return '';
}

/**
 * Prefer the compiled, unit-tested gate. Looks in the target workspace first
 * (AutoClaw dev checkout), then relative to this script (repo layout:
 * adapters/claude-code/hooks/ -> ../../../out/orchestrator/stopGate.js).
 */
function loadCompiledGate(workspaceRoot) {
  const candidates = [
    path.join(workspaceRoot, 'out', 'orchestrator', 'stopGate.js'),
    path.resolve(__dirname, '..', '..', '..', 'out', 'orchestrator', 'stopGate.js'),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        const mod = require(c);
        if (mod && typeof mod.evaluateStopGate === 'function') {
          return mod.evaluateStopGate;
        }
      }
    } catch { /* fall through to the next candidate / inline port */ }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Inline minimal port of src/orchestrator/stopGate.ts (keep in sync).
// Used only when no compiled build is available. Same semantics: bounded,
// session-scoped, fail-open.
// ---------------------------------------------------------------------------

const MAX_MESSAGES = 200;
const MAX_CLAIMS = 200;
const HEARTBEAT_FRESH_MS = 2 * 60 * 60 * 1000; // ~2h
const COMMS_REL = path.join('.autoclaw', 'orchestrator', 'comms');

function evaluateInline(input) {
  try {
    const commsRoot = path.join(input.workspaceRoot, COMMS_REL);
    if (!isDir(commsRoot)) { return { block: false }; }

    // Session-id mapping: scan as the heartbeat session when the raw hook id
    // is unknown to the comms tree (keep in sync with stopGate.ts).
    const effective = resolveEffectiveSessionId(input);
    const scanInput = effective === input.sessionId ? input : Object.assign({}, input, { sessionId: effective });

    const reasons = handoffViolations(scanInput).concat(claimViolations(scanInput));
    if (reasons.length === 0) { return { block: false }; }
    const suffix = reasons.length > 1
      ? ' (+' + (reasons.length - 1) + ' more violation' + (reasons.length > 2 ? 's' : '') + ')'
      : '';
    return { block: true, reason: reasons[0] + suffix };
  } catch {
    return { block: false };
  }
}

/** True when sessionId is stamped on any heartbeat, claim, or shared message. */
function sessionSeenInComms(input, sessionId) {
  const commsRoot = path.join(input.workspaceRoot, COMMS_REL);

  const hbDir = path.join(commsRoot, 'heartbeats');
  for (const name of listJsonFiles(hbDir).slice(0, MAX_CLAIMS)) {
    const hb = readJson(path.join(hbDir, name));
    if (hb && hb.session_id === sessionId) { return true; }
  }

  const claimsDir = path.join(commsRoot, 'claims');
  for (const name of listJsonFiles(claimsDir).slice(0, MAX_CLAIMS)) {
    const claim = readJson(path.join(claimsDir, name));
    if (claim && claim.session_id === sessionId) { return true; }
  }

  const sharedDir = path.join(commsRoot, 'inboxes', 'shared');
  const candidates = [];
  for (const dir of [sharedDir, path.join(sharedDir, 'processed')]) {
    for (const name of listJsonFiles(dir)) {
      candidates.push({ name, file: path.join(dir, name) });
    }
  }
  candidates.sort((a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0)); // newest first
  for (const c of candidates.slice(0, MAX_MESSAGES)) {
    const msg = readJson(c.file);
    if (msg && msg.session_id === sessionId) { return true; }
  }

  return false;
}

/**
 * Substitute the agent's own FRESH heartbeat session when the raw hook id
 * matches nothing in the comms tree. Stale/missing/sessionless heartbeat →
 * the raw id, unchanged (fail-open). Keep in sync with stopGate.ts.
 */
function resolveEffectiveSessionId(input) {
  try {
    if (sessionSeenInComms(input, input.sessionId)) { return input.sessionId; }

    const agentId = typeof input.agentId === 'string' && input.agentId !== '' ? input.agentId : 'claude-code';
    const hb = readJson(path.join(input.workspaceRoot, COMMS_REL, 'heartbeats', sanitize(agentId) + '.json'));
    if (!hb) { return input.sessionId; }

    const hbSession = typeof hb.session_id === 'string' && hb.session_id !== '' ? hb.session_id : '';
    if (!hbSession || hbSession === input.sessionId) { return input.sessionId; }

    const ts = typeof hb.timestamp === 'string' ? Date.parse(hb.timestamp) : NaN;
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > HEARTBEAT_FRESH_MS) {
      return input.sessionId; // stale heartbeat must not resurrect a session
    }
    return hbSession;
  } catch {
    return input.sessionId;
  }
}

function handoffViolations(input) {
  const sharedDir = path.join(input.workspaceRoot, COMMS_REL, 'inboxes', 'shared');
  const candidates = [];
  for (const dir of [sharedDir, path.join(sharedDir, 'processed')]) {
    for (const name of listJsonFiles(dir)) {
      candidates.push({ name, file: path.join(dir, name) });
    }
  }
  candidates.sort((a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0));

  const reasons = [];
  const seen = new Set();
  for (const c of candidates.slice(0, MAX_MESSAGES)) {
    const msg = readJson(c.file);
    if (!msg || msg.type !== 'task_complete' || msg.session_id !== input.sessionId) { continue; }
    const payload = msg.payload && typeof msg.payload === 'object' && !Array.isArray(msg.payload) ? msg.payload : {};
    const taskId = typeof msg.task_id === 'string' && msg.task_id !== ''
      ? msg.task_id
      : typeof payload.task_id === 'string' ? payload.task_id : '';
    if (!taskId || seen.has(taskId)) { continue; }
    seen.add(taskId);

    const conventional = '.autoclaw/orchestrator/comms/handoffs/' +
      sanitize(taskId) + '-' + input.sessionId.slice(0, 8) + '.json';
    const declared = typeof payload.handoff_note === 'string' && payload.handoff_note.trim() !== ''
      ? payload.handoff_note.trim()
      : null;
    const found =
      (declared !== null && refExists(input.workspaceRoot, declared)) ||
      refExists(input.workspaceRoot, conventional);
    if (!found) {
      reasons.push(
        "task_complete for '" + taskId + "' was broadcast by this session but its handoff-note sidecar is missing — " +
        'write ' + (declared || conventional) + ' (protocol rule 7: no handoff note = incomplete task) before stopping.'
      );
    }
  }
  return reasons;
}

function claimViolations(input) {
  const claimsDir = path.join(input.workspaceRoot, COMMS_REL, 'claims');
  const heartbeatsDir = path.join(input.workspaceRoot, COMMS_REL, 'heartbeats');
  const reasons = [];
  for (const name of listJsonFiles(claimsDir).slice(0, MAX_CLAIMS)) {
    const claim = readJson(path.join(claimsDir, name));
    if (!claim || claim.session_id !== input.sessionId) { continue; }
    const owner = typeof claim.claimed_by === 'string' && claim.claimed_by !== ''
      ? claim.claimed_by
      : typeof claim.agent === 'string' && claim.agent !== '' ? claim.agent : '';
    if (!owner) { continue; }
    const taskId = typeof claim.task_id === 'string' && claim.task_id !== ''
      ? claim.task_id
      : name.replace(/\.json$/, '');
    if (!isFile(path.join(heartbeatsDir, sanitize(owner) + '.json'))) {
      reasons.push(
        "claim '" + taskId + "' is held by this session but agent '" + owner + "' has no heartbeat at " +
        '.autoclaw/orchestrator/comms/heartbeats/' + sanitize(owner) + '.json — ' +
        'write your heartbeat or release the claim before stopping.'
      );
    }
  }
  return reasons;
}

// --- tiny fs helpers (all fail-open) ---------------------------------------

function sanitize(s) {
  return s.replace(/[^A-Za-z0-9._-]/g, '_').replace(/\.\./g, '__');
}

function listJsonFiles(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.endsWith('.json'))
      .map((d) => d.name);
  } catch { return []; }
}

function readJson(file) {
  try {
    const v = JSON.parse(fs.readFileSync(file, 'utf8'));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch { return null; }
}

function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function isFile(p) { try { return fs.statSync(p).isFile(); } catch { return false; } }

function refExists(workspaceRoot, ref) {
  try {
    const root = path.resolve(workspaceRoot);
    const abs = path.resolve(root, ref);
    const rootCmp = root.toLowerCase();
    const absCmp = abs.toLowerCase();
    if (absCmp !== rootCmp && !absCmp.startsWith(rootCmp + path.sep)) { return false; }
    return isFile(abs);
  } catch { return false; }
}

// ---------------------------------------------------------------------------

let code = 0;
try {
  code = main();
} catch {
  code = 0; // absolute fail-open
}
process.exit(code);
