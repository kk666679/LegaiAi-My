'use strict';

class LRU {
  constructor(capacity = 256, ttlMs = 60000) {
    this.capacity = Math.max(1, Number(capacity) || 1);
    this.ttlMs = Number(ttlMs) || 0;
    this.map = new Map();
  }

  _now() { return Date.now(); }

  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt: this.ttlMs > 0 ? this._now() + this.ttlMs : 0 });
    if (this.map.size > this.capacity) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) this.map.delete(oldestKey);
    }
    return value;
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (this.ttlMs <= 0) {
      this.map.delete(key);
      return undefined;
    }
    if (entry.expiresAt > 0 && this._now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  has(key) { return this.get(key) !== undefined; }
  delete(key) { return this.map.delete(key); }
  clear() { this.map.clear(); }
  get size() { return this.map.size; }
}

class CacheStore {
  constructor({ responseTTL = 60000, embeddingTTL = 60000, maxResponses = 256, maxEmbeddings = 256 } = {}) {
    this.responses = new LRU(maxResponses, responseTTL);
    this.embeddings = new LRU(maxEmbeddings, embeddingTTL);
    this.metrics = { responses: { hits: 0, misses: 0 }, embeddings: { hits: 0, misses: 0 } };
  }

  setResponse(key, value) { this.responses.set(key, value); return value; }
  getResponse(key) {
    const value = this.responses.get(key);
    if (value === undefined) { this.metrics.responses.misses++; return undefined; }
    this.metrics.responses.hits++; return value;
  }

  setEmbedding(key, value) { this.embeddings.set(key, value); return value; }
  getEmbedding(key) {
    const value = this.embeddings.get(key);
    if (value === undefined) { this.metrics.embeddings.misses++; return undefined; }
    this.metrics.embeddings.hits++; return value;
  }

  stats() {
    return { responses: { ...this.metrics.responses }, embeddings: { ...this.metrics.embeddings } };
  }
}

const cacheExports = { LRU, CacheStore };
if (typeof module !== 'undefined' && module.exports) {
  module.exports = cacheExports;
}

export { LRU, CacheStore };
export default cacheExports;
