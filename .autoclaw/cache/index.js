'use strict';

/**
 * cache — in-process LRU with TTL, plus a two-tier response/embedding store.
 *
 * Deliberately not shared across processes. Anything that must survive a
 * restart belongs in `vector/db.sqlite` or `kg/kg.db`.
 */

class LRU {
  /**
   * @param {number} max     max live entries; eviction is least-recently-used
   * @param {number} ttlMs   entry lifetime; 0 means immediately expired
   */
  constructor(max = 100, ttlMs = 60000) {
    this.max = Math.max(1, Number(max) || 1);
    this.ttlMs = Number(ttlMs) || 0;
    // Map preserves insertion order, which is what makes LRU cheap here:
    // re-inserting on read moves the key to the tail.
    this.map = new Map();
  }

  get size() {
    return this.map.size;
  }

  has(key) {
    const e = this.map.get(key);
    if (!e) return false;
    if (this._expired(e)) { this.map.delete(key); return false; }
    return true;
  }

  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, at: Date.now() });
    while (this.map.size > this.max) {
      const oldest = this.map.keys().next();
      if (oldest.done) break;
      this.map.delete(oldest.value);
    }
    return value;
  }

  get(key) {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (this._expired(e)) { this.map.delete(key); return undefined; }
    // Refresh recency.
    this.map.delete(key);
    this.map.set(key, e);
    return e.value;
  }

  delete(key) {
    return this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }

  keys() {
    return [...this.map.keys()];
  }

  _expired(entry) {
    if (this.ttlMs <= 0) return true;
    return Date.now() - entry.at >= this.ttlMs;
  }
}

/** Counted wrapper so hit/miss rates are observable. */
class CountedCache {
  constructor(max, ttlMs) {
    this.lru = new LRU(max, ttlMs);
    this.hits = 0;
    this.misses = 0;
  }
  get(k) {
    const v = this.lru.get(k);
    if (v === undefined) this.misses++; else this.hits++;
    return v;
  }
  set(k, v) { this.lru.set(k, v); return v; }
  get size() { return this.lru.size; }
  stats() {
    const total = this.hits + this.misses;
    return {
      size: this.lru.size,
      max: this.lru.max,
      hits: this.hits,
      misses: this.misses,
      hitRate: total ? this.hits / total : 0
    };
  }
  clear() { this.lru.clear(); this.hits = 0; this.misses = 0; }
}

/**
 * Two tiers: responses (rendered answers) and embeddings (vectors). Separate
 * tiers because their value sizes and TTL economics differ wildly — an
 * embedding is large and machine-shaped, a response is small and human-shaped.
 */
class CacheStore {
  constructor({ responses = 200, responseTtlMs = 300000, embeddings = 100, embeddingTtlMs = 3600000 } = {}) {
    this.responses = new CountedCache(responses, responseTtlMs);
    this.embeddings = new CountedCache(embeddings, embeddingTtlMs);
  }

  setResponse(key, value) { return this.responses.set(key, value); }
  getResponse(key) { return this.responses.get(key); }

  setEmbedding(key, value) { return this.embeddings.set(key, value); }
  getEmbedding(key) { return this.embeddings.get(key); }

  stats() {
    return {
      responses: this.responses.stats(),
      embeddings: this.embeddings.stats()
    };
  }

  clear() {
    this.responses.clear();
    this.embeddings.clear();
  }
}

module.exports = { LRU, CountedCache, CacheStore };