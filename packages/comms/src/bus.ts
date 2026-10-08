/**
 * @lawmate/comms — In-process message bus.
 *
 * Simple pub/sub. Replace with a real broker (Redis Streams, NATS) in production.
 */
import type { Envelope } from './envelope.js';

type Handler<T> = (msg: Envelope<T>) => void | Promise<void>;

const subscribers = new Map<string, Set<Handler<unknown>>>();

export function subscribe<T>(topic: string, handler: Handler<T>): () => void {
  if (!subscribers.has(topic)) subscribers.set(topic, new Set());
  subscribers.get(topic)!.add(handler as Handler<unknown>);
  return () => subscribers.get(topic)?.delete(handler as Handler<unknown>);
}

export async function publish<T>(topic: string, msg: Envelope<T>): Promise<void> {
  const set = subscribers.get(topic);
  if (!set) return;
  for (const h of set) await h(msg);
}

export function topics(): string[] {
  return Array.from(subscribers.keys());
}
