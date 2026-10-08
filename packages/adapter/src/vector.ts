/**
 * @lawmate/adapter — Vector store adapter.
 */
import { BaseAdapter } from './base.js';
import type { AdapterContext, AdapterResult } from './context.js';

export interface VectorStoreAdapter {
  upsert(collection: string, id: string, vector: number[], metadata: Record<string, unknown>): Promise<AdapterResult<void>>;
  search(collection: string, query: number[], topK: number, filter?: Record<string, unknown>): Promise<AdapterResult<Array<{ id: string; score: number; metadata: Record<string, unknown> }>>>;
  delete(collection: string, id: string): Promise<AdapterResult<boolean>>;
  listCollections(): Promise<AdapterResult<string[]>>;
}

export class InMemoryVectorAdapter extends BaseAdapter implements VectorStoreAdapter {
  readonly name = 'in-memory-vector';
  readonly kind = 'vector';
  private collections = new Map<string, Map<string, { vector: number[]; metadata: Record<string, unknown> }>>();

  async upsert(collection: string, id: string, vector: number[], metadata: Record<string, unknown>): Promise<AdapterResult<void>> {
    return this.run(async () => {
      if (!this.collections.has(collection)) this.collections.set(collection, new Map());
      this.collections.get(collection)!.set(id, { vector, metadata });
    }, {} as AdapterContext);
  }

  async search(collection: string, query: number[], topK: number, filter?: Record<string, unknown>): Promise<AdapterResult<Array<{ id: string; score: number; metadata: Record<string, unknown> }>>> {
    return this.run(async () => {
      const map = this.collections.get(collection);
      if (!map) return [];
      const results: Array<{ id: string; score: number; metadata: Record<string, unknown> }> = [];
      for (const [id, rec] of map) {
        if (filter) {
          let match = true;
          for (const [k, v] of Object.entries(filter)) {
            if (rec.metadata[k] !== v) { match = false; break; }
          }
          if (!match) continue;
        }
        const score = cosine(query, rec.vector);
        results.push({ id, score, metadata: rec.metadata });
      }
      results.sort((a, b) => b.score - a.score);
      return results.slice(0, topK);
    }, {} as AdapterContext);
  }

  async delete(collection: string, id: string): Promise<AdapterResult<boolean>> {
    return this.run(async () => {
      return this.collections.get(collection)?.delete(id) ?? false;
    }, {} as AdapterContext);
  }

  async listCollections(): Promise<AdapterResult<string[]>> {
    return this.run(async () => {
      return Array.from(this.collections.keys());
    }, {} as AdapterContext);
  }
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}