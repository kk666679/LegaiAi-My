'use strict';

const { EventEmitter } = require('events');
const { DEFAULT_STM } = require('./constants');

// ShortTermMemory — per-session bounded ring buffer with TTL eviction.
class ShortTermMemory extends EventEmitter {
  constructor(opts) {
    super();
    opts = opts || {};
    this.capacity = opts.capacity != null ? opts.capacity : DEFAULT_STM.capacity;
    this.ttlMs = opts.ttlMs != null ? opts.ttlMs : DEFAULT_STM.ttlMs;
    this.clock = opts.clock || { now: () => Date.now() };
    this.buffers = new Map();
    this._seq = 0;
  }

  append(sessionId, entry) {
    if (!sessionId) throw new Error('sessionId required');
    if (!entry || typeof entry !== 'object') throw new Error('entry object required');
    const buf = this._buffer(sessionId);
    const now = this.clock.now();
    const e = Object.assign({}, entry, { seq: ++this._seq, ts: now, expiresAt: now + this.ttlMs });
    buf.push(e);
    this._evict(sessionId);
    this.emit('append', { sessionId, entry: e });
    return e;
  }

  recent(sessionId, opts) {
    opts = opts || {};
    const limit = opts.limit || 10;
    this._evict(sessionId);
    const buf = this._buffer(sessionId);
    return buf.slice(-limit).reverse();
  }

  all(sessionId) {
    this._evict(sessionId);
    return this._buffer(sessionId).slice();
  }

  size(sessionId) {
    this._evict(sessionId);
    return this._buffer(sessionId).length;
  }

  sessions() { return Array.from(this.buffers.keys()); }

  clear(sessionId) {
    if (sessionId) this.buffers.delete(sessionId);
    else this.buffers.clear();
    this.emit('clear', { sessionId: sessionId || null });
  }

  stats() {
    const out = { sessions: this.buffers.size, total: 0, bySession: {} };
    for (const id of this.buffers.keys()) {
      const n = this.size(id);
      out.bySession[id] = n;
      out.total += n;
    }
    return out;
  }

  _buffer(id) {
    if (!this.buffers.has(id)) this.buffers.set(id, []);
    return this.buffers.get(id);
  }

  _evict(id) {
    const buf = this.buffers.get(id);
    if (!buf) return;
    const now = this.clock.now();
    while (buf.length && buf[0].expiresAt <= now) buf.shift();
    while (buf.length > this.capacity) buf.shift();
  }
}

module.exports = { ShortTermMemory };
