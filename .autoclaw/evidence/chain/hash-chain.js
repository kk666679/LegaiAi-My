import { createHash } from 'crypto';

export class HashChain {
  constructor({ genesis = 'GENESIS', algorithm = 'sha256' } = {}) {
    this.genesis = genesis;
    this.algorithm = algorithm;
    this._last = null;
  }

  compute(capsule, prev) {
    const { hash: _h, prevHash: _ph, ...capsuleWithoutMeta } = capsule;
    const payload = JSON.stringify({
      capsule: this.canonicalize(capsuleWithoutMeta),
      prevHash: prev?.hash ?? this.genesis,
    });
    return createHash(this.algorithm).update(payload).digest('hex');
  }

  canonicalize(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((v) => this.canonicalize(v));
    const sorted = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = this.canonicalize(obj[key]);
    }
    return sorted;
  }

  advance(record) {
    this._last = record;
  }

  last() {
    return this._last;
  }

  async verify(records) {
    let prev = null;
    let count = 0;
    for await (const record of records) {
      const expected = this.compute(record, prev);
      if (expected !== record.hash) {
        return { valid: false, brokenAt: record.id, expected, found: record.hash };
      }
      prev = record;
      count++;
    }
    return { valid: true, verified: count };
  }
}
