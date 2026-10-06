import crypto from 'crypto';
import fs from 'fs';
import https from 'https';
import path from 'path';

/**
 * daemon/push.ts — CP-4.4: local VAPID web push from autoclawd, free tier.
 *
 * The Control PWA is pull-only without this: a phone must be OPENED to see that
 * a review is waiting. This module lets autoclawd push "awaiting you" events to
 * devices the user enrolled — no hosted infrastructure, no third-party service
 * beyond the browser vendor's push endpoint the SUBSCRIPTION itself names.
 * (Relay-mediated push for devices the daemon cannot reach directly is M6b and
 * lives in the private repo.)
 *
 * Everything here is node:crypto — no dependencies:
 *   - RFC 8292 VAPID: ES256 JWT over the endpoint origin, signed by a persistent
 *     P-256 keypair that doubles as the client's `applicationServerKey`.
 *   - RFC 8291/8188 payload encryption: ECDH(P-256) + HKDF-SHA256 + AES-128-GCM
 *     in a single `aes128gcm` record.
 *
 * Three artifacts under `.autoclaw/control/` (workspace-scoped, gitignored,
 * same home as viewerAuth's pairing/sessions):
 *   push-keys.json          — the VAPID keypair (private JWK). Secret-ish: it
 *                             only authorizes pushes to OUR subscribers.
 *   push-subscriptions.json — enrolled devices (endpoint + client keys).
 *   push-notified.json      — dedup watermark so a review is pushed ONCE when it
 *                             enters the queue, and again only if it re-enters.
 *
 * Pure/testable: the tick takes an injectable `send`, all clocks are parameters,
 * and the crypto helpers are exported so the test can decrypt what we encrypt.
 * No vscode imports — autoclawd + unit tests run this headless.
 */

export let MAX_CONSECUTIVE_FAILURES = void 0;

/* -------------------------------------------------------------------------- */
/*  Small shared helpers (same idioms as viewerAuth)                           */
/* -------------------------------------------------------------------------- */
function controlDir(workspaceRoot) {
    return path.join(workspaceRoot, '.autoclaw', 'control');
}
function keysPath(root) { return path.join(controlDir(root), 'push-keys.json'); }
function subsPath(root) { return path.join(controlDir(root), 'push-subscriptions.json'); }
function notifiedPath(root) { return path.join(controlDir(root), 'push-notified.json'); }
function readJson(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
    }
    catch {
        return null;
    }
}
/** Atomic write (tmp + rename) so a concurrent reader never sees a torn file. */
function writeAtomic(file, value) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8');
    fs.renameSync(tmp, file);
}
function b64url(buf) {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
    return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}
/** JWK x/y → the 65-byte uncompressed EC point browsers expect. */
function jwkToUncompressedPoint(jwk) {
    const x = b64urlDecode(String(jwk.x));
    const y = b64urlDecode(String(jwk.y));
    return Buffer.concat([Buffer.from([0x04]), x, y]);
}
/**
 * Load-or-mint the persistent VAPID keypair. Minted ONCE per workspace; rotating
 * it orphans every existing subscription (the browser binds the subscription to
 * the applicationServerKey), so we never regenerate an existing valid file.
 */
function ensureVapidKeys(workspaceRoot, now = new Date()) {
    const existing = readJson(keysPath(workspaceRoot));
    if (existing && existing.jwk && typeof existing.jwk.d === 'string' && typeof existing.public_key === 'string') {
        return existing;
    }
    const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const jwk = privateKey.export({ format: 'jwk' });
    const record = {
        jwk,
        public_key: b64url(jwkToUncompressedPoint(jwk)),
        created_at: now.toISOString(),
    };
    writeAtomic(keysPath(workspaceRoot), record);
    return record;
}
/** The base64url applicationServerKey the page passes to pushManager.subscribe. */
function vapidPublicKey(workspaceRoot) {
    return ensureVapidKeys(workspaceRoot).public_key;
}
/**
 * RFC 8292 `Authorization: vapid t=<ES256 JWT>, k=<public key>` for one push
 * endpoint. `aud` is the endpoint ORIGIN (the push service), never the full URL.
 * exp is capped at 12h (spec max 24h). `sub` is a contact URI push services may
 * use to reach the operator of a misbehaving sender.
 */
function vapidAuthorizationHeader(workspaceRoot, endpoint, opts = {}) {
    const keys = ensureVapidKeys(workspaceRoot);
    const now = opts.now ?? new Date();
    const contact = opts.contact ?? process.env.AUTOCLAW_PUSH_CONTACT ?? 'https://github.com/GoZippy/autoclaw';
    const header = b64url(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
    const claims = b64url(Buffer.from(JSON.stringify({
        aud: new URL(endpoint).origin,
        exp: Math.floor(now.getTime() / 1000) + 12 * 3600,
        sub: contact,
    })));
    const signingInput = `${header}.${claims}`;
    const key = crypto.createPrivateKey({ key: keys.jwk, format: 'jwk' });
    // ieee-p1363 = the raw r‖s 64-byte form JOSE requires (NOT the DER default).
    const sig = crypto.sign('sha256', Buffer.from(signingInput), { key, dsaEncoding: 'ieee-p1363' });
    return `vapid t=${signingInput}.${b64url(sig)}, k=${keys.public_key}`;
}
/* -------------------------------------------------------------------------- */
/*  RFC 8291 payload encryption (aes128gcm)                                    */
/* -------------------------------------------------------------------------- */
/** One HKDF-SHA256 derive (node's hkdfSync does extract+expand in one call). */
function hkdf(ikm, salt, info, length) {
    return Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, length));
}
/**
 * Encrypt `payload` for a subscriber per RFC 8291, producing the complete
 * `aes128gcm` body (RFC 8188 header ‖ single sealed record). Exported (with its
 * inverse below) so the regression suite can prove the seal round-trips.
 */
function encryptWebPushPayload(payload, uaPublicKeyB64, authSecretB64, testOnly = {}) {
    const uaPublic = b64urlDecode(uaPublicKeyB64);
    const authSecret = b64urlDecode(authSecretB64);
    if (uaPublic.length !== 65 || uaPublic[0] !== 0x04) {
        throw new Error('subscriber p256dh must be a 65-byte uncompressed P-256 point');
    }
    if (authSecret.length !== 16) {
        throw new Error('subscriber auth secret must be 16 bytes');
    }
    const asKeys = testOnly.asKeyPair ?? crypto.createECDH('prime256v1');
    if (!testOnly.asKeyPair) {
        asKeys.generateKeys();
    }
    const asPublic = asKeys.getPublicKey();
    const ecdhSecret = asKeys.computeSecret(uaPublic);
    // RFC 8291 §3.3-3.4: combine the ECDH secret with the auth secret, binding
    // both parties' public keys, then derive the record key + nonce from a salt.
    const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]);
    const ikm = hkdf(ecdhSecret, authSecret, keyInfo, 32);
    const salt = testOnly.salt ?? crypto.randomBytes(16);
    const cek = hkdf(ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
    const nonce = hkdf(ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12);
    // Single record: plaintext ‖ 0x02 (last-record delimiter), sealed.
    const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
    const sealed = Buffer.concat([cipher.update(Buffer.concat([payload, Buffer.from([0x02])])), cipher.final(), cipher.getAuthTag()]);
    // RFC 8188 header: salt(16) ‖ rs(4) ‖ idlen(1) ‖ keyid(=as_public, 65).
    const header = Buffer.alloc(16 + 4 + 1 + 65);
    salt.copy(header, 0);
    header.writeUInt32BE(4096, 16);
    header.writeUInt8(65, 20);
    asPublic.copy(header, 21);
    return Buffer.concat([header, sealed]);
}
/**
 * The inverse of {@link encryptWebPushPayload}, acting as the SUBSCRIBER (browser)
 * side. Test-only in production terms — the daemon never decrypts — but keeping
 * it beside the encryptor pins the wire format against regressions.
 */
function decryptWebPushPayload(body, uaKeyPair, authSecretB64) {
    const salt = body.subarray(0, 16);
    const idlen = body.readUInt8(20);
    const asPublic = body.subarray(21, 21 + idlen);
    const sealed = body.subarray(21 + idlen);
    const ecdhSecret = uaKeyPair.computeSecret(asPublic);
    const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), uaKeyPair.getPublicKey(), asPublic]);
    const ikm = hkdf(ecdhSecret, b64urlDecode(authSecretB64), keyInfo, 32);
    const cek = hkdf(ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
    const nonce = hkdf(ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12);
    const tag = sealed.subarray(sealed.length - 16);
    const ct = sealed.subarray(0, sealed.length - 16);
    const decipher = crypto.createDecipheriv('aes-128-gcm', cek, nonce);
    decipher.setAuthTag(tag);
    const padded = Buffer.concat([decipher.update(ct), decipher.final()]);
    // Strip the delimiter: plaintext ‖ 0x02 ‖ 0x00* for the last record.
    let end = padded.length;
    while (end > 0 && padded[end - 1] === 0x00) {
        end--;
    }
    if (end === 0 || padded[end - 1] !== 0x02) {
        throw new Error('bad record delimiter');
    }
    return padded.subarray(0, end - 1);
}
MAX_CONSECUTIVE_FAILURES = 8;
function listSubscriptions(workspaceRoot) {
    const arr = readJson(subsPath(workspaceRoot));
    return Array.isArray(arr) ? arr : [];
}
function summarizeSubscriptions(workspaceRoot) {
    return listSubscriptions(workspaceRoot).map((s) => ({
        id: s.id,
        endpoint_host: (() => { try {
            return new URL(s.endpoint).host;
        }
        catch {
            return 'invalid';
        } })(),
        label: s.label,
        created_at: s.created_at,
        ...(s.last_ok_at ? { last_ok_at: s.last_ok_at } : {}),
    }));
}
/** Enroll a device (idempotent on endpoint — re-subscribing refreshes keys). */
function addSubscription(workspaceRoot, sub, label = 'paired device', now = new Date()) {
    const endpoint = typeof sub?.endpoint === 'string' ? sub.endpoint : '';
    const p256dh = typeof sub?.keys?.p256dh === 'string' ? sub.keys.p256dh : '';
    const auth = typeof sub?.keys?.auth === 'string' ? sub.keys.auth : '';
    if (!/^https:\/\//.test(endpoint) || !p256dh || !auth) {
        return { ok: false, error: 'subscription requires https endpoint + keys.p256dh + keys.auth' };
    }
    const subs = listSubscriptions(workspaceRoot).filter((s) => s.endpoint !== endpoint);
    const record = {
        id: `push-${crypto.randomUUID()}`,
        endpoint, keys: { p256dh, auth }, label,
        created_at: now.toISOString(), failures: 0,
    };
    subs.push(record);
    writeAtomic(subsPath(workspaceRoot), subs);
    return { ok: true, id: record.id };
}
/** Remove by endpoint (the client knows its own) or by id (the local UI). */
function removeSubscription(workspaceRoot, ref) {
    const subs = listSubscriptions(workspaceRoot);
    const keep = subs.filter((s) => !(ref.endpoint && s.endpoint === ref.endpoint) && !(ref.id && s.id === ref.id));
    if (keep.length === subs.length) {
        return false;
    }
    writeAtomic(subsPath(workspaceRoot), keep);
    return true;
}
/**
 * POST one encrypted notification to one subscription's push service. 201/200/202
 * = delivered to the service; 404/410 = the subscription is GONE (the caller
 * drops it); anything else counts as a transient failure.
 */
function sendWebPush(workspaceRoot, sub, message) {
    return new Promise((resolve) => {
        let body;
        let auth;
        try {
            body = encryptWebPushPayload(Buffer.from(JSON.stringify(message)), sub.keys.p256dh, sub.keys.auth);
            auth = vapidAuthorizationHeader(workspaceRoot, sub.endpoint);
        }
        catch (e) {
            resolve({ ok: false, error: e.message });
            return;
        }
        let u;
        try {
            u = new URL(sub.endpoint);
        }
        catch {
            resolve({ ok: false, error: 'invalid endpoint' });
            return;
        }
        const req = https.request({
            method: 'POST', hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search,
            headers: {
                'Authorization': auth,
                'Content-Encoding': 'aes128gcm',
                'Content-Type': 'application/octet-stream',
                'Content-Length': body.length,
                'TTL': '86400',
                'Urgency': 'normal',
                ...(message.tag ? { 'Topic': message.tag.slice(0, 32) } : {}),
            },
            timeout: 10000,
        }, (res) => {
            res.resume(); // drain
            const status = res.statusCode ?? 0;
            resolve({ ok: status >= 200 && status < 300, status, gone: status === 404 || status === 410 });
        });
        req.on('timeout', () => { req.destroy(new Error('timeout')); });
        req.on('error', (e) => resolve({ ok: false, error: e.message }));
        req.end(body);
    });
}
/** Fan one message out to every enrolled device, dropping gone/dead subs. */
async function broadcastPush(workspaceRoot, message, send = (s, m) => sendWebPush(workspaceRoot, s, m), now = new Date()) {
    const subs = listSubscriptions(workspaceRoot);
    if (subs.length === 0) {
        return { sent: 0, dropped: 0, failed: 0 };
    }
    let sent = 0, dropped = 0, failed = 0;
    const keep = [];
    for (const sub of subs) {
        const r = await send(sub, message);
        if (r.ok) {
            sent++;
            keep.push({ ...sub, failures: 0, last_ok_at: now.toISOString() });
        }
        else if (r.gone || sub.failures + 1 >= exports.MAX_CONSECUTIVE_FAILURES) {
            dropped++;
        }
        else {
            failed++;
            keep.push({ ...sub, failures: sub.failures + 1 });
        }
    }
    writeAtomic(subsPath(workspaceRoot), keep);
    return { sent, dropped, failed };
}
const GATE_KEY = '__wip_gate_closed__';
/**
 * The CP-4.4 event source: push once when a review ENTERS the awaiting-you queue
 * (and once when the WIP gate closes), dedup'd through push-notified.json so a
 * 15-second digest cadence never re-pings a phone for the same item. An item
 * that leaves the queue is forgotten, so a bounced review notifies again — that
 * is deliberate (it needs the human again).
 *
 * Reads board.json/fleet-status.json directly (the same files the web UI serves)
 * rather than importing webui — webui imports THIS module for its routes.
 */
async function runPushTick(workspaceRoot, opts = {}) {
    const subs = listSubscriptions(workspaceRoot);
    if (subs.length === 0) {
        return { pushed: [] };
    } // nobody enrolled — zero cost
    const now = opts.now ?? new Date();
    const orch = path.join(workspaceRoot, '.autoclaw', 'orchestrator');
    const board = readJson(path.join(orch, 'board.json'));
    const digest = readJson(path.join(orch, 'comms', 'fleet-status.json'));
    const waiting = new Map(); // key → human title
    for (const r of Array.isArray(board?.awaiting_review) ? board.awaiting_review : []) {
        if (typeof r?.task_id === 'string' && r.task_id) {
            waiting.set(r.task_id, r.task_id);
        }
    }
    const gate = digest?.review_queue;
    if (gate && gate.gated === true) {
        waiting.set(GATE_KEY, GATE_KEY);
    }
    const stateFile = notifiedPath(workspaceRoot);
    const state = readJson(stateFile) ?? { notified: {} };
    const fresh = [...waiting.keys()].filter((k) => !(k in state.notified));
    const pushed = [];
    for (const key of fresh) {
        const message = key === GATE_KEY
            ? { title: 'AutoClaw — WIP gate closed', body: `Review queue at capacity (${gate?.depth ?? '?'}${gate?.wip_cap ? '/' + gate.wip_cap : ''}) — reviews need you.`, tag: 'wip-gate', url: '/' }
            : { title: 'AutoClaw — review awaiting you', body: `${key} is ready for review — approve or request changes.`, tag: `review-${key}`, url: '/' };
        const r = await broadcastPush(workspaceRoot, message, opts.send, now);
        if (r.sent > 0 || r.failed === 0) {
            pushed.push(key);
        } // only re-try keys whose every send failed transiently
        opts.log?.(`push ${key}: sent=${r.sent} dropped=${r.dropped} failed=${r.failed}`);
    }
    // Watermark = pushed keys; forget keys no longer waiting so re-entry re-notifies.
    const nextNotified = {};
    for (const [k, ts] of Object.entries(state.notified)) {
        if (waiting.has(k)) {
            nextNotified[k] = ts;
        }
    }
    for (const k of pushed) {
        nextNotified[k] = now.toISOString();
    }
    writeAtomic(stateFile, { notified: nextNotified });
    return { pushed };
}
//# sourceMappingURL=push.js.map

export { b64url as b64url, b64urlDecode as b64urlDecode, ensureVapidKeys as ensureVapidKeys, vapidPublicKey as vapidPublicKey, vapidAuthorizationHeader as vapidAuthorizationHeader, encryptWebPushPayload as encryptWebPushPayload, decryptWebPushPayload as decryptWebPushPayload, listSubscriptions as listSubscriptions, summarizeSubscriptions as summarizeSubscriptions, addSubscription as addSubscription, removeSubscription as removeSubscription, sendWebPush as sendWebPush, broadcastPush as broadcastPush, runPushTick as runPushTick };
