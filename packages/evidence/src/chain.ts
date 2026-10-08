import { createHash } from 'node:crypto';
import type { EvidenceEntry } from './entry.js';

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

export class EvidenceChain {
  private entries: EvidenceEntry[] = [];

  append(type: string, payload: unknown): EvidenceEntry {
    const seq = this.entries.length;
    const prev = this.entries[seq - 1];
    const prevHash = seq === 0 || !prev ? 'GENESIS' : prev.hash;
    const createdAt = new Date().toISOString();
    const id = `ev_${seq}_${Math.random().toString(36).slice(2, 10)}`;
    const body = JSON.stringify({ seq, id, type, payload, prevHash, createdAt });
    const hash = sha256(body);
    const entry: EvidenceEntry = { seq, id, type, payload, prevHash, hash, createdAt };
    this.entries.push(entry);
    return entry;
  }

  verify(): { valid: boolean; brokenAt?: number } {
    for (let i = 0; i < this.entries.length; i++) {
      const e = this.entries[i];
      if (!e) return { valid: false, brokenAt: i };
      const prev = this.entries[i - 1];
      const expectedPrev = i === 0 || !prev ? 'GENESIS' : prev.hash;
      if (e.prevHash !== expectedPrev) return { valid: false, brokenAt: i };
      const body = JSON.stringify({
        seq: e.seq, id: e.id, type: e.type, payload: e.payload,
        prevHash: e.prevHash, createdAt: e.createdAt,
      });
      if (sha256(body) !== e.hash) return { valid: false, brokenAt: i };
    }
    return { valid: true };
  }

  list(filter?: { type?: string; fromSeq?: number; toSeq?: number }): EvidenceEntry[] {
    return this.entries.filter((e) => {
      if (filter?.type && e.type !== filter.type) return false;
      if (filter?.fromSeq !== undefined && e.seq < filter.fromSeq) return false;
      if (filter?.toSeq !== undefined && e.seq > filter.toSeq) return false;
      return true;
    });
  }

  head(): EvidenceEntry | undefined { return this.entries[this.entries.length - 1]; }
  size(): number { return this.entries.length; }
  export(): EvidenceEntry[] { return [...this.entries]; }

  static import(entries: EvidenceEntry[]): EvidenceChain {
    const c = new EvidenceChain();
    c.entries = [...entries];
    return c;
  }
}
