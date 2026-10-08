import type { RegistryEntry, RegistryKind } from './entry.js';
export class RegistryCatalog {
  private entries = new Map<string, RegistryEntry>();
  register(entry: RegistryEntry): void { this.entries.set(entry.id, entry); }
  get(id: string): RegistryEntry | undefined { return this.entries.get(id); }
  remove(id: string): boolean { return this.entries.delete(id); }
  list(): RegistryEntry[] { return Array.from(this.entries.values()); }
  findByKind(kind: RegistryKind): RegistryEntry[] { return this.list().filter((e) => e.kind === kind); }
  findByCapability(capability: string): RegistryEntry[] {
    return this.list().filter((e) => (e.capabilities ?? []).includes(capability));
  }
  findByTag(tag: string): RegistryEntry[] { return this.list().filter((e) => (e.tags ?? []).includes(tag)); }
  search(query: string): RegistryEntry[] {
    const needle = query.toLowerCase();
    return this.list().filter((e) =>
      e.id.toLowerCase().includes(needle) ||
      e.name.toLowerCase().includes(needle) ||
      (e.description ?? '').toLowerCase().includes(needle)
    );
  }
  stats(): { total: number; byKind: Record<string, number> } {
    const byKind: Record<string, number> = {};
    for (const e of this.entries.values()) byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
    return { total: this.entries.size, byKind };
  }
}
