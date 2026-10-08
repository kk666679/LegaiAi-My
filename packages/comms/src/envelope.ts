/**
 * @lawmate/comms — Message envelope and serialization.
 */
import { randomUUID } from 'node:crypto';
import {
  MessageEnvelope,
  MessagePriority,
  Actor,
  TenantContext,
} from '@lawmate/types';

export function createMessageEnvelope(params: {
  type: string;
  source: string;
  destination: string;
  actor?: Actor;
  tenant?: TenantContext;
  correlationId?: string;
  causationId?: string;
  ttl?: number;
  priority?: MessagePriority;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): MessageEnvelope {
  return {
    id: `msg://${randomUUID()}`,
    type: params.type,
    source: params.source,
    destination: params.destination,
    actor: params.actor,
    tenant: params.tenant,
    correlationId: params.correlationId || `corr://${randomUUID()}`,
    causationId: params.causationId,
    timestamp: new Date().toISOString(),
    ttl: params.ttl,
    priority: params.priority ?? 5,
    payload: params.payload || {},
    metadata: params.metadata || {},
  };
}

export function serializeMessage(envelope: MessageEnvelope): string {
  return JSON.stringify(envelope);
}

export function deserializeMessage(raw: string): MessageEnvelope {
  const parsed = JSON.parse(raw);
  if (!parsed.id || !parsed.type || !parsed.timestamp) {
    throw new Error('Invalid message envelope: missing required fields');
  }
  return parsed as MessageEnvelope;
}

export function createCorrelationId(): string {
  return `corr://${randomUUID()}`;
}

export function createCausationId(envelope: MessageEnvelope): string {
  return envelope.id;
}