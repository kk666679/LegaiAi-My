"use strict";
/**
 * relay.ts — Cloud relay client (Workstream D.2).
 *
 * The relay forwards a SUBSET of AutoClaw's local file-bus state — heartbeats
 * and inbox messages — to a ZippyTech-hosted endpoint so a web dashboard can
 * show a cross-machine fleet view. It is a Pro-tier preview and is **opt-in**.
 *
 * INERT BY DEFAULT — security posture, enforced in this file:
 *   - The relay endpoint URL comes from `.autoclaw/cloud/relay-config.json`
 *     and DEFAULTS TO EMPTY. With no endpoint configured, every send is a
 *     no-op that returns `{ ok: true, skipped: 'relay_disabled' }`. Nothing
 *     leaves the machine.
 *   - `enabled` must also be explicitly `true`. Endpoint set + `enabled:false`
 *     ⇒ still inert.
 *   - A send requires a stored cloud token (see `auth.ts`). No token ⇒ inert.
 *   - The bearer token rides only in the `Authorization` header and is NEVER
 *     written to the offline queue, a log line, or a request body.
 *   - `POST /v1/inbox` payloads are ENCRYPTED (AES-256-GCM) before the network
 *     call — the relay stores ciphertext at rest (V3_PLAN §6.D.5).
 *   - `POST /v1/heartbeat` is batched + gzip-compressed to keep bandwidth low;
 *     cloud heartbeat cadence is 60s (vs the 30s local tick).
 *
 * Offline behaviour: failed sends are appended to a bounded on-disk queue
 * (`.autoclaw/cloud/queue/`) and retried on the next flush. The queue holds
 * already-encrypted inbox payloads and plain heartbeat batches (heartbeats are
 * low-sensitivity fleet telemetry; inbox messages are encrypted).
 *
 * Uses the Node global `fetch`. Zero `vscode` import → unit-testable.
 *
 * Sprint 4 — D2 (WA-4).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudRelay = exports.CLOUD_HEARTBEAT_INTERVAL_MS = void 0;
exports.defaultRelayConfig = defaultRelayConfig;
exports.endpointIsSecure = endpointIsSecure;
exports.cloudDir = cloudDir;
exports.readRelayConfig = readRelayConfig;
exports.writeRelayConfig = writeRelayConfig;
exports.relayIsActive = relayIsActive;
exports.encryptPayload = encryptPayload;
exports.decryptPayload = decryptPayload;
exports.queueDepth = queueDepth;
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const auth_1 = require("./auth");
const fsp = fs.promises;
// ---------------------------------------------------------------------------
// Relay configuration — defaults to DISABLED
// ---------------------------------------------------------------------------
/** Cloud heartbeat cadence — 60s, deliberately slower than the 30s local tick. */
exports.CLOUD_HEARTBEAT_INTERVAL_MS = 60000;
/** Max retry attempts for a single batch before it is dropped from the queue. */
const MAX_RETRIES = 6;
/** Hard cap on queued items, so a long offline period cannot grow unbounded. */
const MAX_QUEUE_ITEMS = 500;
/** The inert default config — relay OFF, no endpoint. */
function defaultRelayConfig() {
    return {
        endpoint: '',
        enabled: false,
        heartbeatIntervalMs: exports.CLOUD_HEARTBEAT_INTERVAL_MS,
        requestTimeoutMs: 15000,
        tier: 'preview',
        consentAckAt: null,
    };
}
/**
 * F1 (security audit): a relay endpoint must be HTTPS so the bearer token
 * (Authorization header) and payload metadata are never sent in cleartext.
 * Plain `http://` is allowed ONLY for loopback (local dev). Anything else
 * (or an unparseable URL) is rejected ⇒ the relay stays inert.
 */
function endpointIsSecure(endpoint) {
    try {
        const u = new URL(endpoint);
        if (u.protocol === 'https:') {
            return true;
        }
        if (u.protocol === 'http:') {
            return u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '::1';
        }
        return false;
    }
    catch {
        return false;
    }
}
/** Directory holding all cloud-relay state under a workspace `.autoclaw/`. */
function cloudDir(autoclawDir) {
    return path.join(autoclawDir, 'cloud');
}
/**
 * Read the relay config from `.autoclaw/cloud/relay-config.json`.
 *
 * A missing, empty, or unparseable file resolves to {@link defaultRelayConfig}
 * — i.e. the relay is OFF. This is the load-bearing "inert by default" rule.
 */
async function readRelayConfig(autoclawDir) {
    const file = path.join(cloudDir(autoclawDir), 'relay-config.json');
    const base = defaultRelayConfig();
    let raw;
    try {
        raw = await fsp.readFile(file, 'utf8');
    }
    catch {
        return base;
    }
    try {
        const parsed = JSON.parse(raw.replace(/^﻿/, ''));
        const fwd = parsed.forward;
        return {
            endpoint: typeof parsed.endpoint === 'string' ? parsed.endpoint.trim() : base.endpoint,
            enabled: parsed.enabled === true,
            heartbeatIntervalMs: typeof parsed.heartbeatIntervalMs === 'number' && parsed.heartbeatIntervalMs > 0
                ? parsed.heartbeatIntervalMs
                : base.heartbeatIntervalMs,
            requestTimeoutMs: typeof parsed.requestTimeoutMs === 'number' && parsed.requestTimeoutMs > 0
                ? parsed.requestTimeoutMs
                : base.requestTimeoutMs,
            tier: parsed.tier === 'ga' ? 'ga' : 'preview',
            consentAckAt: typeof parsed.consentAckAt === 'string' ? parsed.consentAckAt : null,
            ...(fwd && typeof fwd === 'object'
                ? { forward: { heartbeats: fwd.heartbeats !== false, inbox: fwd.inbox !== false } }
                : {}),
        };
    }
    catch {
        return base;
    }
}
/**
 * Write the relay config to `.autoclaw/cloud/relay-config.json`. Used by the
 * consent flow to record an explicit opt-in (endpoint + `enabled` + `tier:ga`
 * + `consentAckAt`). Persists only the known fields.
 */
async function writeRelayConfig(autoclawDir, cfg) {
    const dir = cloudDir(autoclawDir);
    await fsp.mkdir(dir, { recursive: true });
    const doc = {
        endpoint: typeof cfg.endpoint === 'string' ? cfg.endpoint.trim() : '',
        enabled: cfg.enabled === true,
        heartbeatIntervalMs: typeof cfg.heartbeatIntervalMs === 'number' && cfg.heartbeatIntervalMs > 0 ? cfg.heartbeatIntervalMs : exports.CLOUD_HEARTBEAT_INTERVAL_MS,
        requestTimeoutMs: typeof cfg.requestTimeoutMs === 'number' && cfg.requestTimeoutMs > 0 ? cfg.requestTimeoutMs : 15000,
        tier: cfg.tier === 'ga' ? 'ga' : 'preview',
        consentAckAt: typeof cfg.consentAckAt === 'string' ? cfg.consentAckAt : null,
        ...(cfg.forward ? { forward: { heartbeats: cfg.forward.heartbeats !== false, inbox: cfg.forward.inbox !== false } } : {}),
    };
    await fsp.writeFile(path.join(dir, 'relay-config.json'), JSON.stringify(doc, null, 2) + '\n', 'utf8');
}
/**
 * True only when the relay is genuinely active: explicitly enabled AND a
 * non-empty endpoint is configured. Every send path checks this first.
 */
function relayIsActive(cfg) {
    if (cfg.enabled !== true) {
        return false;
    }
    if (typeof cfg.endpoint !== 'string' || cfg.endpoint.trim().length === 0) {
        return false;
    }
    // F1: a configured endpoint must be HTTPS (or loopback http) or we stay inert.
    if (!endpointIsSecure(cfg.endpoint.trim())) {
        return false;
    }
    // GA tier additionally requires an explicit, recorded consent acknowledgement.
    if (cfg.tier === 'ga' && !cfg.consentAckAt) {
        return false;
    }
    return true;
}
/**
 * Derive the payload-encryption key. The key is derived from the cloud token
 * + installation_id via scrypt — the relay never receives the key, only
 * ciphertext, so payloads are encrypted at rest server-side (V3_PLAN §6.D.5).
 *
 * NOTE: deriving from the bearer token couples key rotation to token rotation
 * — acceptable for the MVP. A future revision can negotiate a dedicated
 * data-encryption key during login.
 */
function derivePayloadKey(token, installationId) {
    return crypto.scryptSync(token, `autoclaw-relay|${installationId}`, 32);
}
/** Encrypt a JSON-serialisable value into an {@link EncryptedEnvelope}. */
function encryptPayload(value, key) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const plain = Buffer.from(JSON.stringify(value), 'utf8');
    const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
    return {
        alg: 'aes-256-gcm',
        iv: iv.toString('hex'),
        tag: cipher.getAuthTag().toString('hex'),
        data: enc.toString('base64'),
    };
}
/** Decrypt an {@link EncryptedEnvelope} produced by {@link encryptPayload}. */
function decryptPayload(env, key) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(env.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(env.tag, 'hex'));
    const plain = Buffer.concat([
        decipher.update(Buffer.from(env.data, 'base64')),
        decipher.final(),
    ]).toString('utf8');
    return JSON.parse(plain);
}
// ---------------------------------------------------------------------------
// Offline queue (bounded, on disk)
// ---------------------------------------------------------------------------
function queueDir(autoclawDir) {
    return path.join(cloudDir(autoclawDir), 'queue');
}
/** Append an item to the on-disk offline queue, bounded at {@link MAX_QUEUE_ITEMS}. */
async function enqueue(autoclawDir, item) {
    const dir = queueDir(autoclawDir);
    await fsp.mkdir(dir, { recursive: true });
    // Drop oldest when over the cap.
    const existing = (await listQueue(autoclawDir)).sort();
    while (existing.length >= MAX_QUEUE_ITEMS) {
        const oldest = existing.shift();
        if (!oldest) {
            break;
        }
        try {
            await fsp.unlink(path.join(dir, oldest));
        }
        catch {
            /* already gone */
        }
    }
    const name = `${Date.now().toString().padStart(15, '0')}-${crypto
        .randomBytes(4)
        .toString('hex')}.json`;
    await fsp.writeFile(path.join(dir, name), JSON.stringify(item), 'utf8');
}
/** List queue filenames (sorted oldest-first by their timestamp prefix). */
async function listQueue(autoclawDir) {
    try {
        const names = await fsp.readdir(queueDir(autoclawDir));
        return names.filter(n => n.endsWith('.json')).sort();
    }
    catch {
        return [];
    }
}
/** Count of items waiting in the offline queue. */
async function queueDepth(autoclawDir) {
    return (await listQueue(autoclawDir)).length;
}
/**
 * POST a JSON value to `{endpoint}{pathSuffix}` with gzip + bearer auth.
 *
 * The body is gzip-compressed; the token is sent ONLY in the `Authorization`
 * header. Returns the HTTP status, or `status: 0` on a network error.
 */
async function postJson(endpoint, pathSuffix, token, body, timeoutMs) {
    const url = endpoint.replace(/\/+$/, '') + pathSuffix;
    const gz = zlib.gzipSync(Buffer.from(JSON.stringify(body), 'utf8'));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'content-encoding': 'gzip',
                // The bearer token lives ONLY here — never in a body or a log.
                authorization: `Bearer ${token}`,
            },
            body: gz,
            signal: controller.signal,
        });
        return {
            ok: resp.ok,
            status: resp.status,
            detail: resp.ok ? 'sent' : `relay returned HTTP ${resp.status}`,
        };
    }
    catch (err) {
        return {
            ok: false,
            status: 0,
            detail: `network error: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
    finally {
        clearTimeout(timer);
    }
}
/**
 * GET JSON from `{endpoint}{pathSuffix}` with bearer auth (AF-7b pull). The
 * token rides ONLY in the Authorization header. Returns the parsed body, or
 * `status: 0` on a network error.
 */
async function getJson(endpoint, pathSuffix, token, timeoutMs) {
    const url = endpoint.replace(/\/+$/, '') + pathSuffix;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const resp = await fetch(url, {
            method: 'GET',
            headers: { accept: 'application/json', authorization: `Bearer ${token}` },
            signal: controller.signal,
        });
        let body = null;
        try {
            body = await resp.json();
        }
        catch {
            body = null;
        }
        return { ok: resp.ok, status: resp.status, body, detail: resp.ok ? 'ok' : `relay returned HTTP ${resp.status}` };
    }
    catch (err) {
        return { ok: false, status: 0, body: null, detail: `network error: ${err instanceof Error ? err.message : String(err)}` };
    }
    finally {
        clearTimeout(timer);
    }
}
/**
 * The cloud relay client. Construct one and call `sendHeartbeats` /
 * `sendInbox` / `flushQueue`. Every method is a SAFE no-op when the relay is
 * not active — callers do not need to guard their call sites.
 */
class CloudRelay {
    constructor(opts) {
        this.autoclawDir = opts.autoclawDir;
        this.secretStore = opts.secretStore;
        this.configOverride = opts.config;
    }
    /** Resolve the active config (override wins; else read from disk). */
    async config() {
        return this.configOverride ?? readRelayConfig(this.autoclawDir);
    }
    /**
     * Resolve `{ token, key }` for an active relay, or a `skipped` reason.
     * The encryption key is derived here and never stored.
     */
    async credentials() {
        const tok = await (0, auth_1.getCloudToken)(this.autoclawDir, this.secretStore);
        if (!tok.ok) {
            return {
                ok: false,
                skipped: tok.reason === 'no_token' ? 'no_token' : 'token_unusable',
                detail: tok.detail,
            };
        }
        const installationId = await (0, auth_1.resolveInstallationId)(this.autoclawDir);
        return {
            ok: true,
            token: tok.record.token,
            key: derivePayloadKey(tok.record.token, installationId),
            installationId,
        };
    }
    /**
     * `POST /v1/heartbeat` — forward a BATCH of heartbeats, gzip-compressed.
     *
     * No-ops (returns `{ ok: true, skipped }`) when the relay is inactive or no
     * token is stored. On a transient failure the batch is queued for retry.
     */
    async sendHeartbeats(heartbeats) {
        const cfg = await this.config();
        if (!relayIsActive(cfg)) {
            return { ok: true, skipped: 'relay_disabled', detail: 'cloud relay is disabled (inert)' };
        }
        // F3: heartbeats leave in clear — honour an explicit opt-out.
        if (cfg.forward && cfg.forward.heartbeats === false) {
            return { ok: true, skipped: 'channel_disabled', detail: 'heartbeat forwarding disabled' };
        }
        if (heartbeats.length === 0) {
            return { ok: true, detail: 'no heartbeats to send' };
        }
        const cred = await this.credentials();
        if (!cred.ok) {
            return { ok: true, skipped: cred.skipped, detail: cred.detail };
        }
        const body = {
            installation_id: cred.installationId,
            batched_at: new Date().toISOString(),
            heartbeats,
        };
        const res = await postJson(cfg.endpoint, '/v1/heartbeat', cred.token, body, cfg.requestTimeoutMs);
        if (!res.ok) {
            await enqueue(this.autoclawDir, {
                kind: 'heartbeat',
                queued_at: new Date().toISOString(),
                attempts: 0,
                body,
            });
            return { ok: false, status: res.status, queued: 1, detail: `${res.detail}; queued for retry` };
        }
        return { ok: true, status: res.status, detail: `${heartbeats.length} heartbeat(s) sent` };
    }
    /**
     * `POST /v1/inbox` — forward inbox messages with each payload ENCRYPTED at
     * rest before the network call (V3_PLAN §6.D.5).
     *
     * Accepts plain inbox messages `{ id, to, from, type, timestamp, payload }`;
     * the `payload` is encrypted into an {@link EncryptedEnvelope} here. The
     * relay only ever stores ciphertext for the message body.
     */
    async sendInbox(messages) {
        const cfg = await this.config();
        if (!relayIsActive(cfg)) {
            return { ok: true, skipped: 'relay_disabled', detail: 'cloud relay is disabled (inert)' };
        }
        if (cfg.forward && cfg.forward.inbox === false) {
            return { ok: true, skipped: 'channel_disabled', detail: 'inbox forwarding disabled' };
        }
        if (messages.length === 0) {
            return { ok: true, detail: 'no inbox messages to send' };
        }
        const cred = await this.credentials();
        if (!cred.ok) {
            return { ok: true, skipped: cred.skipped, detail: cred.detail };
        }
        // Encrypt every payload BEFORE it touches the network or the queue.
        const wire = messages.map(m => ({
            id: m.id,
            to: m.to,
            from: m.from,
            type: m.type,
            timestamp: m.timestamp,
            encrypted: encryptPayload(m.payload, cred.key),
        }));
        const body = {
            installation_id: cred.installationId,
            batched_at: new Date().toISOString(),
            messages: wire,
        };
        const res = await postJson(cfg.endpoint, '/v1/inbox', cred.token, body, cfg.requestTimeoutMs);
        if (!res.ok) {
            // The queued body already contains only ciphertext for message bodies.
            await enqueue(this.autoclawDir, {
                kind: 'inbox',
                queued_at: new Date().toISOString(),
                attempts: 0,
                body,
            });
            return { ok: false, status: res.status, queued: 1, detail: `${res.detail}; queued for retry` };
        }
        return { ok: true, status: res.status, detail: `${messages.length} inbox message(s) sent` };
    }
    /**
     * Flush the offline queue: retry every queued batch. Items that succeed are
     * deleted; items that fail have their `attempts` bumped and are re-queued
     * until {@link MAX_RETRIES}, after which they are dropped.
     *
     * A no-op when the relay is inactive.
     */
    async flushQueue() {
        const cfg = await this.config();
        if (!relayIsActive(cfg)) {
            return {
                ok: true,
                sent: 0,
                dropped: 0,
                remaining: await queueDepth(this.autoclawDir),
                detail: 'cloud relay is disabled (inert) — queue untouched',
            };
        }
        const cred = await this.credentials();
        if (!cred.ok) {
            return {
                ok: true,
                sent: 0,
                dropped: 0,
                remaining: await queueDepth(this.autoclawDir),
                detail: cred.detail,
            };
        }
        const dir = queueDir(this.autoclawDir);
        const names = await listQueue(this.autoclawDir);
        let sent = 0;
        let dropped = 0;
        for (const name of names) {
            const file = path.join(dir, name);
            let item;
            try {
                item = JSON.parse(await fsp.readFile(file, 'utf8'));
            }
            catch {
                // Corrupt queue file — discard it.
                await safeUnlink(file);
                dropped++;
                continue;
            }
            const suffix = item.kind === 'heartbeat' ? '/v1/heartbeat' : '/v1/inbox';
            const res = await postJson(cfg.endpoint, suffix, cred.token, item.body, cfg.requestTimeoutMs);
            if (res.ok) {
                await safeUnlink(file);
                sent++;
            }
            else {
                item.attempts += 1;
                if (item.attempts >= MAX_RETRIES) {
                    await safeUnlink(file);
                    dropped++;
                }
                else {
                    await fsp.writeFile(file, JSON.stringify(item), 'utf8');
                }
            }
        }
        const remaining = await queueDepth(this.autoclawDir);
        return {
            ok: true,
            sent,
            dropped,
            remaining,
            detail: `flushed ${sent} sent, ${dropped} dropped, ${remaining} remaining`,
        };
    }
    /**
     * `GET /v1/inbox` — AF-7b cross-machine PULL. Fetch messages the relay holds
     * for the given agent ids (or all of this installation's), decrypting each
     * payload locally. A no-op (`skipped`) when the relay is inert. The caller
     * applies the returned messages to local inboxes (see
     * `forwarding.applyFetchedToInboxes`).
     */
    async fetchInbox(agentIds) {
        const cfg = await this.config();
        if (!relayIsActive(cfg)) {
            return { ok: true, skipped: 'relay_disabled', messages: [], detail: 'cloud relay is disabled (inert)' };
        }
        const cred = await this.credentials();
        if (!cred.ok) {
            return { ok: true, skipped: cred.skipped, messages: [], detail: cred.detail };
        }
        const q = agentIds && agentIds.length > 0 ? `?to=${encodeURIComponent(agentIds.join(','))}` : '';
        const res = await getJson(cfg.endpoint, `/v1/inbox${q}`, cred.token, cfg.requestTimeoutMs);
        if (!res.ok) {
            return { ok: false, status: res.status, messages: [], detail: res.detail };
        }
        const wire = res.body?.messages ?? [];
        const messages = [];
        for (const m of wire) {
            let payload;
            try {
                payload = decryptPayload(m.encrypted, cred.key);
            }
            catch {
                continue;
            } // skip undecryptable
            messages.push({ id: m.id, to: m.to, from: m.from, type: m.type, timestamp: m.timestamp, payload });
        }
        return { ok: true, status: res.status, messages, detail: `${messages.length} message(s) fetched` };
    }
    /**
     * `GET /v1/heartbeat` — AF-10c. Pull the account's heartbeats (this machine's
     * + every other machine's) for a cross-machine fleet view. Heartbeats are in
     * clear (no decryption). A no-op when the relay is inert.
     */
    async fetchHeartbeats() {
        const cfg = await this.config();
        if (!relayIsActive(cfg)) {
            return { ok: true, skipped: 'relay_disabled', heartbeats: [], detail: 'cloud relay is disabled (inert)' };
        }
        const cred = await this.credentials();
        if (!cred.ok) {
            return { ok: true, skipped: cred.skipped, heartbeats: [], detail: cred.detail };
        }
        const res = await getJson(cfg.endpoint, '/v1/heartbeat', cred.token, cfg.requestTimeoutMs);
        if (!res.ok) {
            return { ok: false, status: res.status, heartbeats: [], detail: res.detail };
        }
        const heartbeats = res.body?.heartbeats ?? [];
        return { ok: true, status: res.status, heartbeats, detail: `${heartbeats.length} heartbeat(s) fetched`, localInstallationId: cred.installationId };
    }
}
exports.CloudRelay = CloudRelay;
/** Delete a file, ignoring "already gone". */
async function safeUnlink(file) {
    try {
        await fsp.unlink(file);
    }
    catch {
        /* already gone */
    }
}
//# sourceMappingURL=relay.js.map