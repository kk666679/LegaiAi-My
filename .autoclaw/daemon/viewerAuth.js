"use strict";
/**
 * daemon/viewerAuth.ts — CP-3.5: viewer/operator session auth for the AutoClaw
 * Control web UI, so the review queue can be READ (and reviews APPROVED) from a
 * paired phone over Tailscale Serve — WITHOUT ever exposing the unauthenticated
 * bridge port (spec §3.5/§3.6).
 *
 * Two artifacts, both under `.autoclaw/control/` (workspace-scoped, gitignored):
 *   pairing.json  — short-lived, SINGLE-USE pairing codes minted by the LOCAL
 *                   human (loopback). Redeeming one mints a session and burns it.
 *   sessions.json — revocable sessions. We persist only a HASH of the session
 *                   token (the raw token lives in the client's cookie), so a
 *                   leaked sessions.json cannot be replayed.
 *
 * Scope model (mirrors the bridge's viewer<agent trust ceiling):
 *   viewer   — read-only glance (board, roster, review queue). CANNOT write.
 *   operator — viewer + may issue `review_decision` (approve / request-changes).
 * The local loopback human is ALWAYS operator (no pairing needed). A proxied
 * (Tailscale-forwarded) request is untrusted until it presents a valid session.
 *
 * Pure + filesystem-only (no vscode, no bridge import) so autoclawd and the unit
 * tests can exercise it headless.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_TOUCH_INTERVAL_MS = exports.SESSION_TTL_MS = exports.PAIRING_CODE_TTL_MS = void 0;
exports.mintPairingCode = mintPairingCode;
exports.redeemPairingCode = redeemPairingCode;
exports.validateSession = validateSession;
exports.revokeSession = revokeSession;
exports.listSessions = listSessions;
exports.sessionTokenFromCookie = sessionTokenFromCookie;
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
exports.PAIRING_CODE_TTL_MS = 3 * 60000; // 3 minutes — long enough to scan, short enough to be safe.
exports.SESSION_TTL_MS = 30 * 24 * 60 * 60000; // 30 days — a paired phone stays paired until revoked/expired.
exports.SESSION_TOUCH_INTERVAL_MS = 5 * 60000; // throttle last_seen_at writes to ≤ once / 5 min per session.
function controlDir(workspaceRoot) {
    return path.join(workspaceRoot, '.autoclaw', 'control');
}
function pairingPath(workspaceRoot) { return path.join(controlDir(workspaceRoot), 'pairing.json'); }
function sessionsPath(workspaceRoot) { return path.join(controlDir(workspaceRoot), 'sessions.json'); }
function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function readArray(file) {
    try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
/** Atomic write (tmp + rename) so a concurrent reader never sees a torn file. */
function writeArray(file, arr) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(arr, null, 2), 'utf8');
    fs.renameSync(tmp, file);
}
/**
 * A pairing code the human can type or embed in a QR. Base32-ish (Crockford,
 * no vowels/confusables) so it survives a hurried phone keyboard. 8 groups of
 * entropy → ~50 bits, ample for a single-use 3-minute code.
 */
function generatePairingCode() {
    const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32 (no I,L,O,U)
    const bytes = crypto.randomBytes(10);
    let out = '';
    for (let i = 0; i < 10; i++) {
        out += alphabet[bytes[i] % 32];
    }
    return `${out.slice(0, 5)}-${out.slice(5)}`; // e.g. "7F3KQ-9WX2N"
}
function normalizeCode(code) {
    return (code || '').toUpperCase().replace(/[^0-9A-Z]/g, ''); // strip the dash + case-fold for lookup
}
/**
 * Mint a single-use pairing code (called from the LOCAL loopback UI). Returns the
 * RAW code once — the caller shows it as a QR / short string. Only its hash is
 * persisted. Expired codes are pruned on write.
 */
function mintPairingCode(workspaceRoot, opts = {}, now = new Date()) {
    const scope = opts.scope === 'viewer' ? 'viewer' : 'operator';
    const ttl = opts.ttlMs ?? exports.PAIRING_CODE_TTL_MS;
    const code = generatePairingCode();
    const expires_at = new Date(now.getTime() + ttl).toISOString();
    const record = {
        code_hash: sha256(normalizeCode(code)),
        scope,
        label: opts.label || 'paired device',
        created_at: now.toISOString(),
        expires_at,
    };
    const file = pairingPath(workspaceRoot);
    const live = readArray(file).filter((r) => new Date(r.expires_at).getTime() > now.getTime());
    live.push(record);
    writeArray(file, live);
    return { code, scope, expires_at, path: `/pair?code=${encodeURIComponent(code)}` };
}
/**
 * Redeem a pairing code → mint a session. SINGLE-USE: the matching pairing record
 * is removed whether or not it had expired, so a code can never be replayed. The
 * raw session token is returned once (for the Set-Cookie); only its hash persists.
 */
function redeemPairingCode(workspaceRoot, rawCode, now = new Date()) {
    const file = pairingPath(workspaceRoot);
    const codes = readArray(file);
    const wanted = sha256(normalizeCode(rawCode));
    const idx = codes.findIndex((r) => r.code_hash === wanted);
    if (idx === -1) {
        return { ok: false, error: 'not_found' };
    }
    const [record] = codes.splice(idx, 1); // burn it — single use, replay-proof
    writeArray(file, codes);
    if (new Date(record.expires_at).getTime() <= now.getTime()) {
        return { ok: false, error: 'expired' };
    }
    const token = crypto.randomBytes(32).toString('hex');
    const session = {
        id: `sess-${crypto.randomUUID()}`,
        token_hash: sha256(token),
        scope: record.scope,
        label: record.label,
        created_at: now.toISOString(),
        expires_at: new Date(now.getTime() + exports.SESSION_TTL_MS).toISOString(),
        revoked_at: null,
    };
    const sessions = readArray(sessionsPath(workspaceRoot));
    sessions.push(session);
    writeArray(sessionsPath(workspaceRoot), sessions);
    return { ok: true, token, scope: session.scope, session_id: session.id, expires_at: session.expires_at };
}
/**
 * Validate a raw session token (from the cookie) → its scope, or null if unknown,
 * revoked, or expired. Constant-time-ish: we hash then compare, so timing does
 * not leak which stored session matched. Touches `last_seen_at` best-effort.
 */
function validateSession(workspaceRoot, rawToken, now = new Date()) {
    if (!rawToken) {
        return null;
    }
    const wanted = sha256(rawToken);
    const file = sessionsPath(workspaceRoot);
    const sessions = readArray(file);
    const found = sessions.find((s) => s.token_hash === wanted);
    if (!found) {
        return null;
    }
    if (found.revoked_at) {
        return null;
    }
    if (new Date(found.expires_at).getTime() <= now.getTime()) {
        return null;
    }
    // Best-effort last-seen bump — THROTTLED to at most once per SESSION_TOUCH_INTERVAL_MS
    // so a burst of concurrent validations doesn't turn into a burst of read/modify/write
    // races over this metadata (it never affects the auth decision, only the display).
    const prevSeen = found.last_seen_at ? new Date(found.last_seen_at).getTime() : 0;
    if (now.getTime() - prevSeen >= exports.SESSION_TOUCH_INTERVAL_MS) {
        try {
            found.last_seen_at = now.toISOString();
            writeArray(file, sessions);
        }
        catch { /* read-only fs is fine */ }
    }
    return { scope: found.scope, id: found.id };
}
/** Revoke a session by id (called from the LOCAL UI). Idempotent. */
function revokeSession(workspaceRoot, sessionId, now = new Date()) {
    const file = sessionsPath(workspaceRoot);
    const sessions = readArray(file);
    const found = sessions.find((s) => s.id === sessionId);
    if (!found) {
        return false;
    }
    found.revoked_at = found.revoked_at ?? now.toISOString();
    writeArray(file, sessions);
    return true;
}
/** List sessions for the local management UI — sanitized (never leaks the hash). */
function listSessions(workspaceRoot, now = new Date()) {
    return readArray(sessionsPath(workspaceRoot)).map((s) => ({
        id: s.id,
        scope: s.scope,
        label: s.label,
        created_at: s.created_at,
        expires_at: s.expires_at,
        revoked: !!s.revoked_at || new Date(s.expires_at).getTime() <= now.getTime(),
        last_seen_at: s.last_seen_at,
    }));
}
/** Parse a session token out of a Cookie header. Returns undefined if absent. */
function sessionTokenFromCookie(cookieHeader, cookieName = 'ac_session') {
    if (!cookieHeader) {
        return undefined;
    }
    for (const part of cookieHeader.split(';')) {
        const eq = part.indexOf('=');
        if (eq === -1) {
            continue;
        }
        if (part.slice(0, eq).trim() === cookieName) {
            return decodeURIComponent(part.slice(eq + 1).trim());
        }
    }
    return undefined;
}
//# sourceMappingURL=viewerAuth.js.map