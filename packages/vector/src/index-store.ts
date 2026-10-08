import { cosine } from './similarity.js';
export interface VectorRecord {
  id: string; vector: number[];
  metadata: Record<string, unknown>; collection: string;
}
export interface SearchHit {
  id: string; score: number; metadata: Record<string, unknown>;
}
export class VectorIndex {
  private collections = new Map<string, Map<string, VectorRecord>>();
  upsert(collection: string, id: string, vector: number[], metadata: Record<string, unknown> = {}): VectorRecord {
    if (!this.collections.has(collection)) this.collections.set(collection, new Map());
    const rec: VectorRecord = { id, vector, metadata, collection };
    this.collections.get(collection)!.set(id, rec);
    return rec;
  }
  get(collection: string, id: string): VectorRecord | undefined {
    return this.collections.get(collection)?.get(id);
  }
  delete(collection: string, id: string): boolean {
    return this.collections.get(collection)?.delete(id) ?? false;
  }
  search(collection: string, query: number[], topK = 10, filter?: (m: Record<string, unknown>) => boolean): SearchHit[] {
    const map = this.collections.get(collection);
    if (!map) return [];
    const hits: SearchHit[] = [];
    for (const rec of map.values()) {
      if (filter && !filter(rec.metadata)) continue;
      hits.push({ id: rec.id, score: cosine(query, rec.vector), metadata: rec.metadata });
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, topK);
  }
  listCollections(): string[] { return Array.from(this.collections.keys()); }
  size(collection: string): number { return this.collections.get(collection)?.size ?? 0; }
  clear(collection?: string): void {
    if (collection) this.collections.delete(collection);
    else this.collections.clear();
  }
}
