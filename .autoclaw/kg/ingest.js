'use strict';

/**
 * ingest — batch writer with retries and a dead-letter queue.
 *
 * Validation failures and exhausted retries land in `dlq` and are reported;
 * they never abort the batch. Nothing is invented here — an item without an id
 * goes to the DLQ, it does not get one.
 */

const { EventEmitter } = require('events');
const { canonicalKey, edgeKey, stableHash } = require('./canonical');

class KGIngest extends EventEmitter {
  constructor(store, { maxRetries = 2, backoffMs = 250, dlq } = {}) {
    super();
    if (!store) throw new Error('KGIngest requires a store');
    this.store = store;
    this.maxRetries = maxRetries;
    this.backoffMs = backoffMs;
    this.dlq = dlq || [];
  }

  _isEdge(item) { return !!(item && (item.from || item.from_id) && (item.to || item.to_id)); }

  _validate(item) {
    if (!item || typeof item !== 'object') return 'not-an-object';
    if (!item.id) return 'missing-id';
    if (this._isEdge(item)) return item.rel ? null : 'missing-rel';
    if (!item.type) return 'missing-type';
    if (!item.title) return 'missing-title';
    return null;
  }

  _deadLetter(item, reason, attempt) {
    const rec = { item, reason, attempt };
    this.dlq.push(rec);
    this.emit('dead-letter', rec);
    return { ok: false, reason };
  }

  async _persist(item) {
    if (this._isEdge(item)) return this.store.putEdge(item);
    return this.store.upsert({ ...item, canonical: item.canonical || canonicalKey(item) });
  }

  async one(item, attempt = 0) {
    const reason = this._validate(item);
    if (reason) return this._deadLetter(item, reason, attempt);
    try {
      const stored = await this._persist(item);
      this.emit('ingested', { id: item.id, edge: this._isEdge(item) });
      return { ok: true, id: item.id, stored };
    } catch (err) {
      if (attempt < this.maxRetries) {
        await new Promise(r => setTimeout(r, this.backoffMs * (attempt + 1)));
        return this.one(item, attempt + 1);
      }
      return this._deadLetter(item, err.message, attempt);
    }
  }

  async batch(items = [], { concurrency = 8 } = {}) {
    const results = new Array(items.length);
    let cursor = 0;
    const worker = async () => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await this.one(items[i]);
      }
    };
    const lanes = Math.max(1, Math.min(concurrency, items.length || 1));
    await Promise.all(Array.from({ length: lanes }, worker));
    const ok = results.filter(r => r && r.ok).length;
    return { total: items.length, ok, failed: items.length - ok, results, dlqSize: this.dlq.length };
  }

  drainDlq() { const out = this.dlq.slice(); this.dlq.length = 0; return out; }

  /** Link two nodes with an id derived from the direction-independent edge key. */
  async link(fromId, toId, rel = 'related', weight = 0.5, extra = {}) {
    const id = `e_${stableHash(edgeKey(fromId, toId, rel))}`;
    return this.one({ id, from: fromId, to: toId, rel, weight, ...extra });
  }
}

module.exports = { KGIngest };