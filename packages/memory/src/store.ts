import type { MemoryRecord } from './record.js';
import type { RecallQuery } from './query.js';
export class MemoryStore {
  private records = new Map<string, MemoryRecord>();
  remember(input: Omit<MemoryRecord, 'id' | 'createdAt' | 'updatedAt' | 'confidence' | 'provenance'> & Partial<Pick<MemoryRecord, 'id' | 'confidence' | 'provenance'>>): MemoryRecord {
    const now = new Date().toISOString();
    const rec: MemoryRecord = {
      id: input.id ?? `m_${Math.random().toString(36).slice(2, 10)}`,
      agentId: input.agentId, type: input.type, key: input.key,
      content: input.content, summary: input.summary, embedding: input.embedding,
      metadata: input.metadata ?? {}, tenantId: input.tenantId, projectId: input.projectId,
      confidence: input.confidence ?? 1, createdAt: now, updatedAt: now,
      expiresAt: input.expiresAt, provenance: input.provenance ?? [],
    };
    this.records.set(rec.id, rec);
    return rec;
  }
  get(id: string): MemoryRecord | undefined {
    const rec = this.records.get(id);
    if (!rec) return undefined;
    if (rec.expiresAt && new Date(rec.expiresAt) < new Date()) { this.records.delete(id); return undefined; }
    return rec;
  }
  recall(q: RecallQuery): MemoryRecord[] {
    const limit = q.limit ?? 10;
    const now = Date.now();
    let pool = Array.from(this.records.values()).filter((r) => {
      if (r.expiresAt && new Date(r.expiresAt).getTime() < now) return false;
      if (r.agentId !== q.agentId) return false;
      if (q.type && r.type !== q.type) return false;
      if (q.key && r.key !== q.key) return false;
      if (q.tenantId && r.tenantId !== q.tenantId) return false;
      if (q.projectId && r.projectId !== q.projectId) return false;
      if (q.minConfidence !== undefined && r.confidence < q.minConfidence) return false;
      return true;
    });
    if (q.query) {
      const needle = q.query.toLowerCase();
      pool = pool.filter((r) => r.content.toLowerCase().includes(needle) || r.key.toLowerCase().includes(needle));
    }
    return pool.sort((a, b) => b.confidence - a.confidence || b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
  }
  forget(id: string): boolean { return this.records.delete(id); }
  purgeExpired(): number {
    const now = Date.now();
    let n = 0;
    for (const [id, r] of this.records) {
      if (r.expiresAt && new Date(r.expiresAt).getTime() < now) { this.records.delete(id); n++; }
    }
    return n;
  }
  size(): number { return this.records.size; }
  clear(): void { this.records.clear(); }
}
