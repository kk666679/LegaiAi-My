export class DedupEngine {
  constructor({ windowMs = 60000, maxSize = 10000 } = {}) {
    this.windowMs = windowMs;
    this.maxSize = maxSize;
    this.seenKeys = new Map();
  }

  isDuplicate(idempotencyKey) {
    const seen = this.seenKeys.get(idempotencyKey);
    if (!seen) {
      return false;
    }

    const age = Date.now() - seen.ts;
    if (age > this.windowMs) {
      this.seenKeys.delete(idempotencyKey);
      return false;
    }

    return true;
  }

  record(idempotencyKey, metadata = {}) {
    // Prune old entries if needed
    if (this.seenKeys.size >= this.maxSize) {
      this.prune();
    }

    this.seenKeys.set(idempotencyKey, {
      ts: Date.now(),
      ...metadata,
    });
  }

  prune() {
    const now = Date.now();
    const toDelete = [];

    for (const [key, value] of this.seenKeys) {
      if (now - value.ts > this.windowMs) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.seenKeys.delete(key);
    }
  }

  getCount() {
    return this.seenKeys.size;
  }

  reset() {
    this.seenKeys.clear();
  }

  getStats() {
    return {
      uniqueKeys: this.seenKeys.size,
      windowMs: this.windowMs,
      maxSize: this.maxSize,
    };
  }
}
