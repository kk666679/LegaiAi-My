/**
 * @lawmate/adapter — Adapter registry and discovery.
 */
import type { BaseAdapter } from './base.js';

export interface AdapterInfo {
  id: string;
  name: string;
  kind: string;
  healthy: boolean;
  capabilities: string[];
}

export class AdapterRegistry {
  private adapters = new Map<string, BaseAdapter>();
  private capabilities = new Map<string, Set<string>>();

  register(adapter: BaseAdapter, capabilities: string[]): void {
    this.adapters.set(adapter.name, adapter);
    this.capabilities.set(adapter.name, new Set(capabilities));
  }

  get(name: string): BaseAdapter | undefined {
    return this.adapters.get(name);
  }

  list(): AdapterInfo[] {
    return Array.from(this.adapters.entries()).map(([name, adapter]) => ({
      id: name,
      name: adapter.name,
      kind: adapter.kind,
      healthy: adapter['healthy'],
      capabilities: Array.from(this.capabilities.get(name) ?? []),
    }));
  }

  findByCapability(capability: string): AdapterInfo[] {
    return this.list().filter((a) => a.capabilities.includes(capability));
  }

  async health(name: string): Promise<boolean> {
    const adapter = this.adapters.get(name);
    if (!adapter) return false;
    return adapter.health();
  }

  remove(name: string): boolean {
    const removed = this.adapters.delete(name);
    this.capabilities.delete(name);
    return removed;
  }

  clear(): void {
    this.adapters.clear();
    this.capabilities.clear();
  }
}