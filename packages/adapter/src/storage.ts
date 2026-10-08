/**
 * @lawmate/adapter — Storage adapter for key-value and document stores.
 */
import { BaseAdapter } from './base.js';
import type { AdapterContext, AdapterResult } from './context.js';

export interface StorageAdapter {
  get(key: string): Promise<AdapterResult<unknown>>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<AdapterResult<void>>;
  delete(key: string): Promise<AdapterResult<boolean>>;
  keys(prefix?: string): Promise<AdapterResult<string[]>>;
  clear(): Promise<AdapterResult<void>>;
}

export class InMemoryStorageAdapter extends BaseAdapter implements StorageAdapter {
  readonly name = 'in-memory-storage';
  readonly kind = 'storage';
  private store = new Map<string, { value: unknown; expiresAt?: number }>();

  async get(key: string): Promise<AdapterResult<unknown>> {
    return this.run(async () => {
      const entry = this.store.get(key);
      if (!entry) throw new Error(`Key not found: ${key}`);
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.store.delete(key);
        throw new Error(`Key expired: ${key}`);
      }
      return entry.value;
    }, {} as AdapterContext);
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<AdapterResult<void>> {
    return this.run(async () => {
      this.store.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
      });
    }, {} as AdapterContext);
  }

  async delete(key: string): Promise<AdapterResult<boolean>> {
    return this.run(async () => this.store.delete(key), {} as AdapterContext);
  }

  async keys(prefix?: string): Promise<AdapterResult<string[]>> {
    return this.run(async () => {
      const all = Array.from(this.store.keys());
      return prefix ? all.filter((k) => k.startsWith(prefix)) : all;
    }, {} as AdapterContext);
  }

  async clear(): Promise<AdapterResult<void>> {
    return this.run(async () => { this.store.clear(); }, {} as AdapterContext);
  }
}