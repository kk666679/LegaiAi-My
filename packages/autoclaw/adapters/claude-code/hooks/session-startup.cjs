#!/usr/bin/env node
'use strict';
/**
 * session-startup.cjs — Claude Code SessionStart hook: first-turn digest.
 *
 * Prints the "picking up where we left off" block (this agent's open claims,
 * top claimable tasks, inbox items needing action, recent decisions, latest
 * handoff notes, suggested next prompts) to STDOUT, which Claude Code injects
 * into the session's context at start/resume. Zero LLM cost; the digest is a
 * bounded deterministic read of `.autoclaw/orchestrator/`.
 *
 * Protocol (Claude Code SessionStart hook):
 *   stdin:  JSON {"session_id", "transcript_path", "cwd"?, "source"?}
 *   stdout: text to add to Claude's context. Printing nothing adds nothing.
 *   exit 0 always — a SessionStart hook must never block a session.
 *
 * Guarantees:
 *   - ABSOLUTE FAIL-OPEN: any error anywhere -> print NOTHING, exit 0.
 *   - SILENT OUTSIDE FLEETS: no `.autoclaw/orchestrator/` dir -> print nothing
 *     (foreign projects get zero noise).
 *   - ZERO DEPENDENCIES: node:fs + node:path only. Prefers the compiled digest
 *     (out/orchestrator/sessionStartup.js — the tested implementation); falls
 *     back to the minimal inline port below when no build is present.
 *   - Kill switch: AUTOCLAW_SESSION_STARTUP=0 disables the hook entirely.
 *   - Agent identity: AUTOCLAW_AGENT_ID env var, default 'claude-code'.
 *
 * Registration: see README.md next to this file.
 */

const fs = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

function main() {
  if (process.env.AUTOCLAW_SESSION_STARTUP === '0') { return; }

  let input = {};
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    input = {}; // unreadable stdin — still try env/cwd resolution
  }
  if (!input || typeof input !== 'object') { input = {}; }

  const workspaceRoot = resolveWorkspaceRoot(input);
  if (!workspaceRoot) { return; }

  // Silent outside fleet workspaces: no orchestrator tree -> no output.
  if (!isDir(path.join(workspaceRoot, '.autoclaw', 'orchestrator'))) { return; }

  const agentId = (process.env.AUTOCLAW_AGENT_ID || 'claude-code').trim() || 'claude-code';

  const compiled = loadCompiledDigest(workspaceRoot);
  const text = compiled
    ? textFromCompiled(compiled, workspaceRoot, agentId)
    : renderInline(workspaceRoot, agentId);

  if (typeof text === 'string' && text.trim() !== '') {
    process.stdout.write(text.trimEnd() + '\n');
  }
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
 * Prefer the compiled, unit-tested digest. Looks in the target workspace first
 * (AutoClaw dev checkout), then relative to this script (repo layout:
 * adapters/claude-code/hooks/ -> ../../../out/orchestrator/sessionStartup.js).
 */
function loadCompiledDigest(workspaceRoot) {
  const candidates = [
    path.join(workspaceRoot, 'out', 'orchestrator', 'sessionStartup.js'),
    path.resolve(__dirname, '..', '..', '..', 'out', 'orchestrator', 'sessionStartup.js'),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        const mod = require(c);
        if (mod && typeof mod.buildSessionStartupDigest === 'function') {
          return mod.buildSessionStartupDigest;
        }
      }
    } catch { /* fall through to the next candidate / inline port */ }
  }
  return null;
}

function textFromCompiled(build, workspaceRoot, agentId) {
  try {
    const digest = build({ workspaceRoot, agentId });
    return digest && typeof digest.text_for_user === 'string' ? digest.text_for_user : '';
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Inline minimal port of src/orchestrator/sessionStartup.ts (keep in sync).
// Used only when no compiled build is available. Compact digest: own claims,
// review_requests in the inbox, top claimable board tasks, latest handoffs,
// suggested next actions. Same semantics: bounded, agent-scoped, fail-open.
// ---------------------------------------------------------------------------

const MAX_SCAN = 200;
const ORCH_REL = path.join('.autoclaw', 'orchestrator');
const COMMS_REL = path.join(ORCH_REL, 'comms');

function renderInline(root, agentId) {
  try {
    const now = Date.now();
    const lines = ['Picking up where we left off — agent ' + agentId];

    // Own claims.
    const claims = [];
    const claimsDir = path.join(root, COMMS_REL, 'claims');
    for (const name of listJson(claimsDir).slice(0, MAX_SCAN)) {
      const c = readJson(path.join(claimsDir, name));
      if (!c) { continue; }
      const owner = strOr(c.claimed_by) || strOr(c.agent);
      if (owner !== agentId) { continue; }
      const taskId = strOr(c.task_id) || name.replace(/\.json$/, '');
      claims.push(taskId + ' — claimed by you' + ageSuffix(now, c.claimed_at));
    }
    pushSection(lines, 'Your open claims (' + claims.length + '):', claims, 2);

    // Pending review_requests (and questions) in THIS agent's inbox only.
    const inboxDir = path.join(root, COMMS_REL, 'inboxes', agentId);
    const pending = [];
    let firstReview = null;
    for (const name of listJson(inboxDir).reverse().slice(0, MAX_SCAN)) {
      const m = readJson(path.join(inboxDir, name));
      if (!m) { continue; }
      const st = readJson(path.join(inboxDir, '_state', name.replace(/\.json$/, '') + '.json'));
      if (st && (st.replied_at || st.archived_at)) { continue; }
      if (m.type !== 'review_request' && m.type !== 'question' && m.requires_response !== true) { continue; }
      const row = (m.type || 'message') + (m.from ? ' from ' + m.from : '') +
        (m.task_id ? ' re ' + m.task_id : '') + ageSuffix(now, m.timestamp, ' (', ')');
      if (m.type === 'review_request') {
        pending.unshift(row);
        if (!firstReview) { firstReview = m; }
      } else {
        pending.push(row);
      }
    }
    pushSection(lines, 'Inbox needing action (' + pending.length + '):', pending, 3);

    // Top claimable from board.json (minus own claims — board excludes ALL claimed).
    const board = readJson(path.join(root, ORCH_REL, 'board.json'));
    const claimable = [];
    let firstClaimable = null;
    if (board && Array.isArray(board.claimable)) {
      for (const t of board.claimable.slice(0, 3)) {
        if (!t || typeof t.task_id !== 'string') { continue; }
        if (!firstClaimable) { firstClaimable = t; }
        claimable.push(t.task_id + (t.priority ? ' [' + t.priority + ']' : '') +
          ' ' + (t.title ? String(t.title).slice(0, 70) : '(untitled)'));
      }
    }
    pushSection(lines, 'Claimable now:', claimable, 3);

    // Latest handoffs by timestamp.
    const hoDir = path.join(root, COMMS_REL, 'handoffs');
    const notes = [];
    for (const name of listJson(hoDir).slice(0, MAX_SCAN)) {
      const n = readJson(path.join(hoDir, name));
      if (!n || typeof n.task_id !== 'string') { continue; }
      notes.push(n);
    }
    notes.sort((a, b) => (Date.parse(b.timestamp || '') || 0) - (Date.parse(a.timestamp || '') || 0));
    pushSection(lines, 'Latest handoffs:', notes.slice(0, 2).map((n) =>
      n.task_id + (n.agent_id ? ' by ' + n.agent_id : '') + ageSuffix(now, n.timestamp) +
      (n.summary ? ' — ' + String(n.summary).replace(/\s+/g, ' ').slice(0, 80) : '')), 2);

    // Suggested next actions.
    const prompts = [];
    if (claims.length > 0) { prompts.push('Continue task ' + claims[0].split(' ')[0]); }
    if (firstReview) {
      prompts.push('Answer pending review_request ' + (firstReview.id || '(unknown)') +
        (firstReview.from ? ' from ' + firstReview.from : ''));
    }
    if (firstClaimable && prompts.length < 3) {
      prompts.push('Claim ' + firstClaimable.task_id + ': ' + (firstClaimable.title || '(untitled)'));
    }
    if (prompts.length > 0) {
      lines.push('Suggested next:');
      prompts.slice(0, 3).forEach((p, i) => lines.push('  ' + (i + 1) + '. ' + p));
    }

    return lines.length > 1 ? lines.slice(0, 25).join('\n') : '';
  } catch {
    return '';
  }
}

function pushSection(lines, header, items, show) {
  if (items.length === 0) { return; }
  lines.push(header + (items.length > show ? ' (+' + (items.length - show) + ' more)' : ''));
  for (const it of items.slice(0, show)) { lines.push('  - ' + it); }
}

function ageSuffix(now, iso, pre, post) {
  const then = typeof iso === 'string' ? Date.parse(iso) : NaN;
  if (!Number.isFinite(then)) { return ''; }
  const ms = now - then;
  let label;
  if (!Number.isFinite(ms) || ms < 60000) { label = 'just now'; }
  else if (ms < 3600000) { label = Math.floor(ms / 60000) + 'm ago'; }
  else if (ms < 48 * 3600000) { label = Math.floor(ms / 3600000) + 'h ago'; }
  else { label = Math.floor(ms / 86400000) + 'd ago'; }
  return (pre || ' ') + label + (post || '');
}

// --- tiny fs helpers (all fail-open) ---------------------------------------

function strOr(v) { return typeof v === 'string' && v !== '' ? v : ''; }

function listJson(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.endsWith('.json'))
      .map((d) => d.name)
      .sort();
  } catch { return []; }
}

function readJson(file) {
  try {
    const v = JSON.parse(fs.readFileSync(file, 'utf8'));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch { return null; }
}

function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }

// ---------------------------------------------------------------------------

try {
  main();
} catch {
  // absolute fail-open: print nothing extra, never a nonzero exit
}
process.exit(0);
