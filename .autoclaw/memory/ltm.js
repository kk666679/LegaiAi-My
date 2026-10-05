'use strict';

const { EventEmitter } = require('events');
const { DEFAULT_LTM, KIND } = require('./constants');
const { UnknownEntryError } = require('./errors');

function uniq(arr) { return Array.from(new Set(arr || [])); }

// LongTermMemory — persistent, salience-scored, tag/kind indexed.
class LongTermMemory extends EventEmitter {
  constructor(opts) {
    super();
    opts = opts || {};
    this.salienceFloor = opts.salienceFloor != null ? opts.salienceFloor : DEFAULT_LTM.salienceFloor;
    this.decayFactor   = opts.decayFactor   != null ? opts.decayFactor   : DEFAULT_LTM.decayFactor;
    this.maxEntries    = opts.maxEntries    != null ? opts.maxEntries    : DEFAULT_LTM.maxEntries;
    this.clock = opts.clock || { now: () => Date.now() };
    this.entries = new Map();
    this.tagIndex = new Map();
    this.kindIndex = new Map();
    this.persistence = opts.persistence || null;
    this._seq = 0;
  }

  commit(input) {
    input = input || {};
    if (!input.text && !input.metadata) throw new Error('commit requires { text }');
    const now = this.clock.now();
    const id = input.id || this._genId();
    const existing = this.entries.get(id);
    const tags = uniq([].concat(existing ? existing.tags : [], input.tags || []));
    let e;
    if (existing) {
      e = Object.assign({}, existing, {
        kind: input.kind || existing.kind,
        text: input.text != null ? input.text : existing.text,
        tags,
        salience: Math.max(existing.salience, input.salience != null ? input.salience : existing.salience),
        source: input.source || existing.source || null,
        metadata: Object.assign({}, existing.metadata || {}, input.metadata || {}),
        updatedAt: now
      });
    } else {
      e = {
        id,
        kind: input.kind || KIND.NOTE,
        text: input.text || '',
        tags,
        salience: input.salience != null ? input.salience : 0.5,
        source: input.source || null,
        metadata: input.metadata || {},
        createdAt: now,
        updatedAt: now,
        accessCount: 0,
        lastAccessAt: null
      };
    }
    this.entries.set(id, e);
    this._reindex(id, e);
    this._enforceCap();
    if (this.persistence) this.persistence.append({ op: 'commit', entry: e });
    this.emit(existing ? 'update' : 'commit', e);
    return e;
  }

  get(id) {
    const e = this.entries.get(id);
    if (!e) return null;
    e.accessCount += 1;
    e.lastAccessAt = this.clock.now();
    if (this.persistence) this.persistence.append({ op: 'access', id, at: e.lastAccessAt });
    this.emit('access', e);
    return e;
  }

  remove(id) {
    if (!this.entries.has(id)) return false;
    this.entries.delete(id);
    for (const set of this.tagIndex.values()) set.delete(id);
    for (const set of this.kindIndex.values()) set.delete(id);
    if (this.persistence) this.persistence.append({ op: 'remove', id });
    this.emit('remove', { id });
    return true;
  }

  list(opts) {
    opts = opts || {};
    let pool = Array.from(this.entries.values());
    if (opts.kind) pool = pool.filter(e => e.kind === opts.kind);
    if (opts.tag)  pool = pool.filter(e => (e.tags || []).indexOf(opts.tag) >= 0);
    pool.sort((a, b) => (b.salience || 0) - (a.salience || 0));
    if (opts.limit) pool = pool.slice(0, opts.limit);
    return pool;
  }

  byTag(tag) {
    const ids = this.tagIndex.get(tag);
    if (!ids) return [];
    const out = [];
    for (const id of ids) { const e = this.entries.get(id); if (e) out.push(e); }
    return out;
  }

  byKind(kind) {
    const ids = this.kindIndex.get(kind);
    if (!ids) return [];
    const out = [];
    for (const id of ids) { const e = this.entries.get(id); if (e) out.push(e); }
    return out;
  }

  score(e, q) {
    let s = 0;
    const now = q.now || this.clock.now();
    if (q.tags && q.tags.length) {
      const overlap = q.tags.filter(t => (e.tags || []).indexOf(t) >= 0).length;
      s += overlap * 2;
    }
    if (q.q) {
      const needle = String(q.q).toLowerCase();
      const hay = ((e.text || '') + ' ' + (e.tags || []).join(' ') + ' ' + e.kind).toLowerCase();
      if (hay.indexOf(needle) >= 0) s += 3;
      const tokens = needle.match(/[a-z0-9]+/g) || [];
      let overlap = 0;
      for (const t of tokens) if (t.length > 2 && hay.indexOf(t) >= 0) overlap += 1;
      s += overlap * 0.75;
    }
    s += (e.salience || 0) * 1.5;
    const ageMs = now - (e.updatedAt || e.createdAt || now);
    const ageDays = ageMs / 86400000;
    s += 1 / (1 + ageDays);
    return s;
  }

  query(opts) {
    opts = opts || {};
    const limit = opts.limit || 8;
    const minScore = opts.minScore != null ? opts.minScore : 0;
    const now = this.clock.now();
    let pool = Array.from(this.entries.values());
    if (opts.kind) pool = pool.filter(e => e.kind === opts.kind);
    if (opts.tags && opts.tags.length) pool = pool.filter(e => opts.tags.some(t => (e.tags || []).indexOf(t) >= 0));
    const scored = pool.map(e => ({ e, s: this.score(e, { q: opts.q, tags: opts.tags, now }) }))
      .filter(x => x.s >= minScore)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit);
    return scored.map(x => Object.assign({}, x.e, { _score: Number(x.s.toFixed(4)) }));
  }

  decay(opts) {
    opts = opts || {};
    const factor = opts.factor != null ? opts.factor : this.decayFactor;
    const floor  = opts.floor  != null ? opts.floor  : this.salienceFloor;
    const prune  = opts.prune !== false;
    let removed = 0;
    const toRemove = [];
    for (const id of this.entries.keys()) {
      const e = this.entries.get(id);
      e.salience = Math.max(0, (e.salience || 0) * factor);
      if (prune && e.salience < floor) toRemove.push(id);
    }
    for (const id of toRemove) { if (this.remove(id)) removed += 1; }
    this.emit('decay', { factor, floor, removed });
    return { decayed: this.entries.size, removed };
  }

  stats() {
    const kinds = {};
    const tags = {};
    let avgSalience = 0;
    for (const e of this.entries.values()) {
      kinds[e.kind] = (kinds[e.kind] || 0) + 1;
      avgSalience += e.salience || 0;
      for (const t of (e.tags || [])) tags[t] = (tags[t] || 0) + 1;
    }
    const topTags = Object.keys(tags).sort((a, b) => tags[b] - tags[a]).slice(0, 10)
      .map(t => ({ tag: t, count: tags[t] }));
    return {
      entries: this.entries.size,
      kinds,
      tags: tags,
      topTags,
      avgSalience: this.entries.size ? Number((avgSalience / this.entries.size).toFixed(4)) : 0
    };
  }

  snapshot() { return Array.from(this.entries.values()).map(e => JSON.parse(JSON.stringify(e))); }

  clear() {
    this.entries.clear();
    this.tagIndex.clear();
    this.kindIndex.clear();
    this.emit('clear');
  }

  _genId() { return 'ltm_' + (++this._seq) + '_' + this.clock.now().toString(36); }

  _reindex(id, e) {
    for (const set of this.tagIndex.values()) set.delete(id);
    for (const set of this.kindIndex.values()) set.delete(id);
    for (const t of (e.tags || [])) {
      if (!this.tagIndex.has(t)) this.tagIndex.set(t, new Set());
      this.tagIndex.get(t).add(id);
    }
    if (!this.kindIndex.has(e.kind)) this.kindIndex.set(e.kind, new Set());
    this.kindIndex.get(e.kind).add(id);
  }

  _enforceCap() {
    while (this.entries.size > this.maxEntries) {
      let lowestId = null;
      let lowest = Infinity;
      for (const id of this.entries.keys()) {
        const s = this.entries.get(id).salience || 0;
        if (s < lowest) { lowest = s; lowestId = id; }
      }
      if (lowestId) this.remove(lowestId); else break;
    }
  }
}

module.exports = { LongTermMemory };
