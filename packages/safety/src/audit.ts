/**
 * @lawmate/safety — Audit event recorder.
 *
 * Append-oriented. Never allow ordinary agents to mutate audit logs.
 */
import { randomUUID } from 'node:crypto';
import {
  AuditEvent,
  AuditCategory,
  Decision,
  Actor,
  TenantContext,
  Timestamp,
} from '@lawmate/types';

export interface AuditRecorder {
  record(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent;
  query(filter: AuditFilter): AuditEvent[];
  getRecent(limit?: number): AuditEvent[];
}

export interface AuditFilter {
  actorId?: string;
  category?: AuditCategory;
  decision?: Decision;
  since?: Timestamp;
  limit?: number;
}

export class InMemoryAuditRecorder implements AuditRecorder {
  private events: AuditEvent[] = [];

  record(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const full: AuditEvent = {
      ...event,
      id: `audit://${randomUUID()}`,
      timestamp: new Date().toISOString(),
    };
    this.events.push(full);
    return full;
  }

  query(filter: AuditFilter): AuditEvent[] {
    return this.events.filter((e) => {
      if (filter.actorId && e.actor?.id !== filter.actorId) return false;
      if (filter.category && e.category !== filter.category) return false;
      if (filter.decision && e.decision !== filter.decision) return false;
      if (filter.since && e.timestamp < filter.since) return false;
      return true;
    });
  }

  getRecent(limit = 50): AuditEvent[] {
    return this.events.slice(-limit);
  }
}

export function createAuditRecorder(): AuditRecorder {
  return new InMemoryAuditRecorder();
}