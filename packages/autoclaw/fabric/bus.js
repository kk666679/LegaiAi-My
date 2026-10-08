import * as bridge_1 from '../bridge/index.js';
/**
 * fabric.ts — Cross-agent message bus abstraction.
 *
 * Phase 2B of the Distributed Agent Fabric (see
 * `docs/DISTRIBUTED_AGENT_FABRIC.md` §3 Phase 2 and
 * `docs/specs/nats-topic-conventions.md`).
 *
 * `FabricBus` is a thin pluggable pub/sub layer that AutoClaw can use as a
 * fast-path notification channel. It does NOT replace the filesystem
 * mailbox — per the spec, FS remains the canonical durable record. The bus
 * is a fanout for ephemeral events and a future fast-path for durable
 * envelopes (callers always FS-write first, then publish to the bus).
 *
 * Three drivers:
 *   - `fs`   No-op pub/sub. comms.ts already writes to disk; the FS driver
 *            simply records stats and returns. publish/subscribe are
 *            silent — subscribers will not see published messages because
 *            FS-only deployments rely on inbox polling for delivery.
 *   - `ws`   Wraps the existing in-process `BridgeEventBus` from bridge.ts.
 *            publish() forwards to BridgeEventBus.publish(); subscribe()
 *            registers a handler. Useful for tests and SSE/WS push paths.
 *   - `nats` Lazy-loaded NATS client (the `nats` npm package). Listed under
 *            `optionalDependencies` in package.json so installs without it
 *            still succeed. If the package can't be loaded or the server
 *            can't be reached, this driver falls back gracefully to the
 *            `fs` no-op driver and emits a one-line warning.
 *
 * Important: this module MUST NOT import `vscode`. It is unit-tested in
 * plain Mocha. Anything VS Code-specific lives in extension.ts.
 */
Object.defineProperty(exports, "__esModule", { value: true });

// ---------------------------------------------------------------------------
// `fs` driver — no-op
// ---------------------------------------------------------------------------
class FsBus {
    constructor() {
        this.driver = 'fs';
        this.subscribers = 0;
        this.published = 0;
        this.closed = false;
    }
    async publish(_topic, _data) {
        if (this.closed) {
            return;
        }
        // FS path delivers via comms.ts file IO, not via this bus.
        this.published++;
    }
    async subscribe(_pattern, _handler) {
        if (this.closed) {
            return () => { };
        }
        this.subscribers++;
        let live = true;
        return () => {
            if (!live) {
                return;
            }
            live = false;
            this.subscribers = Math.max(0, this.subscribers - 1);
        };
    }
    async close() {
        // Idempotent: closing twice is a no-op.
        this.closed = true;
    }
    stats() {
        return { driver: this.driver, subscribers: this.subscribers, published: this.published };
    }
}
function isWsEnvelope(v) {
    return !!v
        && typeof v === 'object'
        && '__ac_topic' in v
        && typeof v.__ac_topic === 'string';
}
class WsBus {
    constructor(bus) {
        this.bus = bus;
        this.driver = 'ws';
        this.subscribers = 0;
        this.published = 0;
        this.unsubs = [];
        this.closed = false;
    }
    async publish(topic, data) {
        if (this.closed) {
            return;
        }
        const envelope = { __ac_topic: topic, data };
        // BridgeEventBus 'message' takes a Message; we cast through unknown
        // because the ws fabric repurposes the channel as a generic transport.
        this.bus.publish('message', envelope);
        this.published++;
    }
    async subscribe(pattern, handler) {
        if (this.closed) {
            return () => { };
        }
        const matcher = compileTopicMatcher(pattern);
        const wrapped = (raw) => {
            if (!isWsEnvelope(raw)) {
                return;
            }
            if (!matcher(raw.__ac_topic)) {
                return;
            }
            try {
                handler(raw.__ac_topic, raw.data);
            }
            catch (e) {
                console.error('FabricBus(ws) handler error:', e);
            }
        };
        const unsub = this.bus.subscribe('message', wrapped);
        this.subscribers++;
        let live = true;
        const wrappedUnsub = () => {
            if (!live) {
                return;
            }
            live = false;
            this.subscribers = Math.max(0, this.subscribers - 1);
            try {
                unsub();
            }
            catch { /* ignore */ }
            this.unsubs = this.unsubs.filter(u => u !== wrappedUnsub);
        };
        this.unsubs.push(wrappedUnsub);
        return wrappedUnsub;
    }
    async close() {
        if (this.closed) {
            return;
        }
        this.closed = true;
        for (const u of this.unsubs.splice(0)) {
            try {
                u();
            }
            catch { /* ignore */ }
        }
    }
    stats() {
        return { driver: this.driver, subscribers: this.subscribers, published: this.published };
    }
}
class NatsBus {
    constructor(nc) {
        this.nc = nc;
        this.driver = 'nats';
        this.subscribers = 0;
        this.published = 0;
        this.subs = [];
        this.closed = false;
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
    }
    async publish(topic, data) {
        if (this.closed) {
            return;
        }
        const payload = this.encoder.encode(JSON.stringify(data ?? null));
        this.nc.publish(topic, payload);
        this.published++;
    }
    async subscribe(pattern, handler) {
        if (this.closed) {
            return () => { };
        }
        const sub = this.nc.subscribe(pattern);
        this.subs.push(sub);
        this.subscribers++;
        // Drain the async iterator in the background; one consumer per sub.
        (async () => {
            try {
                for await (const m of sub) {
                    let data = null;
                    try {
                        data = JSON.parse(this.decoder.decode(m.data));
                    }
                    catch {
                        data = null;
                    }
                    try {
                        handler(m.subject, data);
                    }
                    catch (e) {
                        console.error('FabricBus(nats) handler error:', e);
                    }
                }
            }
            catch { /* unsubscribed or connection closed */ }
        })();
        let live = true;
        return () => {
            if (!live) {
                return;
            }
            live = false;
            this.subscribers = Math.max(0, this.subscribers - 1);
            try {
                sub.unsubscribe();
            }
            catch { /* ignore */ }
            this.subs = this.subs.filter(s => s !== sub);
        };
    }
    async close() {
        if (this.closed) {
            return;
        }
        this.closed = true;
        for (const s of this.subs.splice(0)) {
            try {
                s.unsubscribe();
            }
            catch { /* ignore */ }
        }
        try {
            await this.nc.close();
        }
        catch { /* ignore */ }
    }
    stats() {
        return { driver: this.driver, subscribers: this.subscribers, published: this.published };
    }
}
// ---------------------------------------------------------------------------
// Topic matcher (used by ws driver and any future driver that needs
// client-side filtering)
// ---------------------------------------------------------------------------
/**
 * Compile a NATS-style topic pattern into a predicate. Supported wildcards:
 *   - `*` matches a single token (no dots).
 *   - `>` (terminal only) matches one or more tokens.
 *
 * Spec reference: docs/specs/nats-topic-conventions.md §2.
 */
function compileTopicMatcher(pattern) {
    if (pattern === '>' || pattern === '*') {
        if (pattern === '>') {
            return () => true;
        }
        return (topic) => topic.length > 0 && !topic.includes('.');
    }
    const tokens = pattern.split('.');
    const reSrc = tokens.map((t, i) => {
        if (t === '*') {
            return '[^.]+';
        }
        if (t === '>' && i === tokens.length - 1) {
            return '.+';
        }
        return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('\\.');
    const re = new RegExp('^' + reSrc + '$');
    return (topic) => re.test(topic);
}
// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
/**
 * Create a {@link FabricBus} for the given driver. See the module header for
 * driver semantics. Never throws on a missing optional `nats` dependency —
 * that case logs a warning and returns the `fs` driver.
 */
async function createFabricBus(opts) {
    const logger = opts.logger ?? console;
    if (opts.driver === 'fs') {
        return new FsBus();
    }
    if (opts.driver === 'ws') {
        const bus = opts.bus ?? new bridge_1.BridgeEventBus();
        return new WsBus(bus);
    }
    // driver === 'nats'
    // The cast to `string` defeats tsc's static module resolution so this file
    // compiles cleanly when the optional `nats` package is not installed.
    const importer = opts._mockImport ?? (() => Promise.resolve(`${'nats'}`).then(s => import(s)));
    let mod;
    try {
        mod = await importer();
    }
    catch (e) {
        logger.warn(`FabricBus: nats package not available (${e.message}); falling back to fs driver`);
        return new FsBus();
    }
    if (!mod || typeof mod.connect !== 'function') {
        logger.warn('FabricBus: nats package returned no connect() entry point; falling back to fs driver');
        return new FsBus();
    }
    const url = opts.natsUrl ?? 'nats://127.0.0.1:4222';
    try {
        const nc = await mod.connect({ servers: url });
        return new NatsBus(nc);
    }
    catch (e) {
        logger.warn(`FabricBus: could not connect to NATS at ${url} (${e.message}); falling back to fs driver`);
        return new FsBus();
    }
}
//# sourceMappingURL=bus.js.map

export { compileTopicMatcher as compileTopicMatcher, createFabricBus as createFabricBus };
