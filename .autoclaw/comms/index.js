import { Rooms } from './rooms.js';
import { Inbox } from './inboxState.js';
import { Heartbeat } from './heartbeat.js';
import { SignalBus } from './signals/signal-bus.js';
import { AgentSubscriptions } from './signals/subscriptions.js';
import { BackpressureController } from './signals/backpressure.js';
import { AtLeastOnceDelivery } from './messages/delivery.js';
import { DedupEngine } from './messages/dedup.js';
import { MessageEnvelope } from './messages/envelope.js';

export class Comms {
  constructor({ config = {} } = {}) {
    this.config = {
      roomsDir: config.roomsDir ?? '.autoclaw/orchestrator/comms',
      inboxDir: config.inboxDir ?? '.autoclaw/orchestrator/comms/inboxes',
      heartbeatMs: config.heartbeatMs ?? 30000,
      maxQueueDepth: config.maxQueueDepth ?? 10000,
      ...config,
    };

    this.rooms = new Rooms({ baseDir: this.config.roomsDir });
    this.inbox = new Inbox({ baseDir: this.config.inboxDir });
    this.heartbeat = new Heartbeat({ intervalMs: this.config.heartbeatMs });
    this.bus = new SignalBus({ maxQueue: this.config.maxQueueDepth });
    this.backpressure = new BackpressureController();
    this.delivery = new AtLeastOnceDelivery();
    this.dedup = new DedupEngine();
    this.agentSubscriptions = new Map();
  }

  async send({ to, from, type, payload, room, idempotencyKey }) {
    // Check for duplicates
    const key = idempotencyKey ?? `${from}:${to}:${type}:${Date.now()}`;
    if (this.dedup.isDuplicate(key)) {
      return { delivered: false, reason: 'duplicate', idempotencyKey: key };
    }

    // Create message envelope
    const envelope = new MessageEnvelope({
      message: { from, to, type, payload, room },
      idempotencyKey: key,
    });

    // Write to inbox
    try {
      await this.inbox.write(to, envelope.message);
      this.dedup.record(key, { ts: Date.now() });
    } catch (error) {
      console.error('[comms] Inbox write failed:', error);
      return { delivered: false, reason: 'inbox_write_failed', error: error.message };
    }

    // Publish to signal bus
    try {
      await this.bus.publish(`agent:${to}`, envelope.message);
    } catch (error) {
      console.error('[comms] Signal bus publish failed:', error);
      return { delivered: false, reason: 'bus_publish_failed', error: error.message };
    }

    return { delivered: true, id: envelope.id, idempotencyKey: key };
  }

  async subscribe(agentId, handler) {
    const subs = this.getOrCreateSubscriptions(agentId);
    return subs.subscribe(`agent:${agentId}`, handler);
  }

  async subscribePattern(agentId, pattern, handler) {
    const subs = this.getOrCreateSubscriptions(agentId);
    return subs.subscribePattern(pattern, handler);
  }

  getOrCreateSubscriptions(agentId) {
    if (!this.agentSubscriptions.has(agentId)) {
      this.agentSubscriptions.set(
        agentId,
        new AgentSubscriptions({ agentId, bus: this.bus })
      );
    }
    return this.agentSubscriptions.get(agentId);
  }

  async broadcast({ room, type, payload, from }) {
    const subscribers = await this.rooms.subscribers(room);
    const results = await Promise.allSettled(
      subscribers.map((to) => this.send({ to, from, type, payload, room }))
    );
    return { room, count: subscribers.length, results };
  }

  async health() {
    return {
      rooms: await this.rooms.count(),
      inboxDepth: await this.inbox.totalDepth(),
      busQueue: this.bus.queueDepth(),
      busStats: this.bus.getStats(),
      backpressure: this.backpressure.getStatus(),
      delivery: this.delivery.getStats(),
      dedup: this.dedup.getStats(),
    };
  }

  async start() {
    await this.heartbeat.start();
    return { status: 'started' };
  }

  async stop() {
    await this.heartbeat.stop();
    this.bus.reset();
    return { status: 'stopped' };
  }
}
