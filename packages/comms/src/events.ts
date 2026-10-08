/**
 * @lawmate/comms — EventBus for domain events.
 */
import {
  EventEnvelope,
  EventType,
} from '@lawmate/types';
import { createMessageEnvelope } from './envelope';

export interface EventBus {
  publish(event: Omit<EventEnvelope, 'id' | 'timestamp'>): EventEnvelope;
  subscribe(eventType: EventType | '*', handler: (event: EventEnvelope) => void): () => void;
  getHistory(eventType?: EventType, limit?: number): EventEnvelope[];
  clear(): void;
}

export class InMemoryEventBus implements EventBus {
  private events: EventEnvelope[] = [];
  private handlers = new Map<string, ((event: EventEnvelope) => void)[]>();

  publish(event: Omit<EventEnvelope, 'id' | 'timestamp'>): EventEnvelope {
    const full: EventEnvelope = {
      ...event,
      id: event.id || `evt://${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      payload: event.payload || {},
      metadata: event.metadata || {},
    };
    this.events.push(full);
    this.emitType('*', full);
    this.emitType(full.type, full);
    return full;
  }

  subscribe(eventType: EventType | '*', handler: (event: EventEnvelope) => void): () => void {
    const list = this.handlers.get(eventType) || [];
    list.push(handler);
    this.handlers.set(eventType, list);
    return () => {
      const current = this.handlers.get(eventType) || [];
      const idx = current.indexOf(handler);
      if (idx >= 0) current.splice(idx, 1);
    };
  }

  getHistory(eventType?: EventType, limit = 100): EventEnvelope[] {
    let filtered = this.events;
    if (eventType) filtered = filtered.filter((e) => e.type === eventType);
    return filtered.slice(-limit);
  }

  clear(): void {
    this.events = [];
    this.handlers.clear();
  }

  private emitType(eventType: string, event: EventEnvelope): void {
    const handlers = this.handlers.get(eventType) || [];
    for (const handler of handlers) {
      try {
        handler(event);
      } catch {
        // Swallow; errors should be audited elsewhere.
      }
    }
  }
}

export function createEventBus(): EventBus {
  return new InMemoryEventBus();
}

export function envelopeToEvent(envelope: EventEnvelope): EventEnvelope {
  return envelope;
}

export function createEvent(params: {
  type: EventType;
  source: string;
  actor?: { id: string; type: 'user' | 'agent' | 'system' | 'service' };
  tenant?: { tenantId?: string; projectId?: string; actorId?: string };
  correlationId: string;
  causationId?: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Omit<EventEnvelope, 'id' | 'timestamp'> {
  return {
    type: params.type,
    source: params.source,
    actor: params.actor,
    tenant: params.tenant,
    correlationId: params.correlationId,
    causationId: params.causationId,
    payload: params.payload || {},
    metadata: params.metadata || {},
  };
}