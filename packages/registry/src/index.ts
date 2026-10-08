/**
 * @lawmate/registry — Component registry.
 *
 * Every entry has a stable identifier. Revoked entries must never be executed.
 */
import {
  RegistryEntry,
  RegistryQuery,
  RegistrySearchResult,
  RegistryStatus,
  LawmateError,
  ErrorCode,
  Id,
  Version,
} from '@lawmate/types';

export interface ComponentRegistry {
  register(entry: Omit<RegistryEntry, 'createdAt' | 'updatedAt'>): RegistryEntry;
  update(id: Id, updates: Partial<RegistryEntry>): RegistryEntry;
  get(id: Id): RegistryEntry | undefined;
  query(filter: RegistryQuery): RegistrySearchResult;
  listCapabilities(): string[];
  deactivate(id: Id): RegistryEntry;
  deprecate(id: Id): RegistryEntry;
  revoke(id: Id): RegistryEntry;
  isExecutable(id: Id): boolean;
  healthCheck(id: Id): RegistryEntry;
}

export class InMemoryComponentRegistry implements ComponentRegistry {
  private entries = new Map<string, RegistryEntry>();

  register(entry: Omit<RegistryEntry, 'createdAt' | 'updatedAt'>): RegistryEntry {
    const existing = this.entries.get(entry.id);
    const now = new Date().toISOString();
    const full: RegistryEntry = {
      ...entry,
      status: entry.status || 'active',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    this.entries.set(entry.id, full);
    return full;
  }

  update(id: Id, updates: Partial<RegistryEntry>): RegistryEntry {
    const existing = this.entries.get(id);
    if (!existing) {
      throw notFound(id);
    }
    const updated: RegistryEntry = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.entries.set(id, updated);
    return updated;
  }

  get(id: Id): RegistryEntry | undefined {
    return this.entries.get(id);
  }

  query(filter: RegistryQuery): RegistrySearchResult {
    let results = Array.from(this.entries.values());

    if (filter.kind) results = results.filter((e) => e.kind === filter.kind);
    if (filter.status) results = results.filter((e) => e.status === filter.status);
    if (filter.capability) results = results.filter((e) => e.capabilities.includes(filter.capability!));
    if (filter.version) results = results.filter((e) => e.version === filter.version || e.compatibility.includes(filter.version!));

    const total = results.length;
    let cursorIndex = 0;
    if (filter.cursor) {
      cursorIndex = results.findIndex((e) => e.id === filter.cursor);
      if (cursorIndex >= 0) results = results.slice(cursorIndex + 1);
    }

    const limit = filter.limit || 50;
    const page = results.slice(0, limit);
    const nextCursor = results.length > limit ? page[page.length - 1]?.id : undefined;

    return { entries: page, total, nextCursor };
  }

  listCapabilities(): string[] {
    const caps = new Set<string>();
    for (const e of this.entries.values()) {
      for (const c of e.capabilities) caps.add(c);
    }
    return Array.from(caps);
  }

  deactivate(id: Id): RegistryEntry {
    return this.update(id, { status: 'disabled' });
  }

  deprecate(id: Id): RegistryEntry {
    return this.update(id, { status: 'deprecated' });
  }

  revoke(id: Id): RegistryEntry {
    return this.update(id, { status: 'revoked' });
  }

  isExecutable(id: Id): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    return entry.status === 'active';
  }

  healthCheck(id: Id): RegistryEntry {
    const entry = this.entries.get(id);
    if (!entry) throw notFound(id);
    return this.update(id, {
      health: {
        status: 'healthy',
        checkedAt: new Date().toISOString(),
      },
    });
  }

  private assertCompatible(id: Id, version: Version): void {
    const entry = this.entries.get(id);
    if (!entry) throw notFound(id);
    if (entry.status === 'revoked') {
      throw revokedError(id);
    }
    if (entry.status === 'deprecated' && !entry.compatibility.includes(version) && entry.version !== version) {
      throw deprecatedError(id);
    }
  }
}

export function createRegistry(): ComponentRegistry {
  return new InMemoryComponentRegistry();
}

function notFound(id: Id): LawmateError {
  return {
    code: 'NOT_FOUND',
    message: `Registry entry not found: ${id}`,
    timestamp: new Date().toISOString(),
  };
}

function revokedError(id: Id): LawmateError {
  return {
    code: 'REGISTRY_ERROR',
    message: `Registry entry is revoked and must not be executed: ${id}`,
    timestamp: new Date().toISOString(),
  };
}

function deprecatedError(id: Id): LawmateError {
  return {
    code: 'REGISTRY_ERROR',
    message: `Registry entry is deprecated: ${id}`,
    timestamp: new Date().toISOString(),
  };
}

export function assertExecutable(registry: ComponentRegistry, id: Id, version?: Version): RegistryEntry {
  const entry = registry.get(id);
  if (!entry) {
    throw notFound(id);
  }
  if (entry.status === 'revoked') {
    throw revokedError(id);
  }
  if (entry.status !== 'active') {
    throw {
      code: 'REGISTRY_ERROR' as ErrorCode,
      message: `Registry entry is not active (status=${entry.status}): ${id}`,
      timestamp: new Date().toISOString(),
    };
  }
  if (version && entry.version !== version && !entry.compatibility.includes(version)) {
    throw {
      code: 'REGISTRY_ERROR' as ErrorCode,
      message: `Version ${version} not compatible with ${id} (current=${entry.version})`,
      timestamp: new Date().toISOString(),
    };
  }
  return entry;
}