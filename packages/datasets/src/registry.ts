import type { Dataset } from './dataset.js';

export class DatasetRegistry {
  private datasets = new Map<string, Dataset>();

  register<T>(ds: Dataset<T>): void { this.datasets.set(ds.id, ds as Dataset); }
  get(id: string): Dataset | undefined { return this.datasets.get(id); }
  list(): Dataset[] { return Array.from(this.datasets.values()); }
  remove(id: string): boolean { return this.datasets.delete(id); }

  findByTag(tag: string): Dataset[] {
    return this.list().filter((d) => d.tags.includes(tag));
  }

  sample<T>(id: string, n: number): T[] {
    const ds = this.datasets.get(id);
    if (!ds) return [];
    const arr = ds.data as T[];
    if (arr.length === 0) return [];
    const out: T[] = [];
    for (let i = 0; i < Math.min(n, arr.length); i++) {
      const pick = arr[Math.floor(Math.random() * arr.length)];
      if (pick !== undefined) out.push(pick);
    }
    return out;
  }
}
