/**
 * @lawmate/comms — In-memory message bus (default transport).
 *
 * All communication must respect @lawmate/safety. Messages carry tenant
 * context and authorization is checked at the consumer, not the transport.
 */
import { EventEmitter } from 'node:events';
import {
  MessageEnvelope,
  DeliveryStatus,
} from '@lawmate/types';
import { createMessageEnvelope, deserializeMessage, serializeMessage } from './envelope';

export interface MessageBus {
  send(envelope: MessageEnvelope): Promise<void>;
  sendAndReceive(envelope: MessageEnvelope, timeoutMs?: number): Promise<MessageEnvelope>;
  subscribe(destination: string, handler: (envelope: MessageEnvelope) => Promise<void> | void): () => void;
  broadcast(envelope: MessageEnvelope): Promise<void>;
  getHistory(destination: string, limit?: number): MessageEnvelope[];
  close(): Promise<void>;
}

export class InMemoryMessageBus extends EventEmitter implements MessageBus {
  private handlers = new Map<string, ((envelope: MessageEnvelope) => Promise<void> | void)[]>();
  private pending = new Map<string, { resolve: (env: MessageEnvelope) => void; timer: NodeJS.Timeout }>();
  private history: MessageEnvelope[] = [];

  async send(envelope: MessageEnvelope): Promise<void> {
    this.history.push(envelope);
    this.emit(`msg:${envelope.destination}`, envelope);
    const handlers = this.handlers.get(envelope.destination) || [];
    for (const handler of handlers) {
      try {
        await handler(envelope);
      } catch {
        // Swallow handler errors; they are reported via audit.
      }
    }
  }

  async sendAndReceive(envelope: MessageEnvelope, timeoutMs = 30_000): Promise<MessageEnvelope> {
    const replyDestination = `${envelope.destination}:reply:${envelope.id}`;
    return new Promise<MessageEnvelope>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(envelope.id);
        reject(new Error(`Timeout waiting for reply to ${envelope.id}`));
      }, timeoutMs);

      this.pending.set(envelope.id, { resolve, timer });

      this.subscribe(replyDestination, async (reply) => {
        const entry = this.pending.get(envelope.id);
        if (!entry) return;
        clearTimeout(entry.timer);
        this.pending.delete(envelope.id);
        entry.resolve(reply);
      });

      this.send(envelope).catch(reject);
    });
  }

  subscribe(destination: string, handler: (envelope: MessageEnvelope) => Promise<void> | void): () => void {
    const list = this.handlers.get(destination) || [];
    list.push(handler);
    this.handlers.set(destination, list);
    this.on(`msg:${destination}`, handler);
    return () => {
      const current = this.handlers.get(destination) || [];
      const idx = current.indexOf(handler);
      if (idx >= 0) current.splice(idx, 1);
      this.removeListener(`msg:${destination}`, handler);
    };
  }

  async broadcast(envelope: MessageEnvelope): Promise<void> {
    this.history.push(envelope);
    this.emit('broadcast', envelope);
  }

  getHistory(destination: string, limit = 100): MessageEnvelope[] {
    return this.history
      .filter((m) => m.destination === destination || m.source === destination)
      .slice(-limit);
  }

  async close(): Promise<void> {
    this.removeAllListeners();
    this.handlers.clear();
    for (const entry of this.pending.values()) {
      clearTimeout(entry.timer);
    }
    this.pending.clear();
  }
}

export function createMessageBus(): MessageBus {
  return new InMemoryMessageBus();
}

export function createReplyEnvelope(request: MessageEnvelope, payload: Record<string, unknown>): MessageEnvelope {
  return createMessageEnvelope({
    type: `${request.type}.reply`,
    source: request.destination,
    destination: request.source,
    actor: request.actor,
    tenant: request.tenant,
    causationId: request.id,
    correlationId: request.correlationId,
    payload,
  });
}