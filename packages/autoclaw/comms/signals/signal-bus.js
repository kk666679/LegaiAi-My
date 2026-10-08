export class SignalBus {
  constructor({ maxQueue = 10000 } = {}) {
    this.maxQueue = maxQueue;
    this.topics = new Map();
    this.subscribers = new Map();
    this.dlq = [];
    this.stats = {
      published: 0,
      delivered: 0,
      failed: 0,
      dlqed: 0,
    };
  }

  async publish(topic, message) {
    // Validate queue depth
    const queue = this.topics.get(topic) ?? [];
    if (queue.length >= this.maxQueue) {
      this.dlq.push({ topic, message, reason: 'queue_full', ts: Date.now() });
      this.stats.dlqed++;
      throw new Error(`Queue full for topic: ${topic}`);
    }

    // Add to queue
    const envelope = {
      id: this.generateId(),
      topic,
      message,
      ts: Date.now(),
      attempts: 0,
    };

    queue.push(envelope);
    this.topics.set(topic, queue);
    this.stats.published++;

    // Fan-out to subscribers (async)
    const subs = this.subscribers.get(topic) ?? [];
    for (const handler of subs) {
      this.deliverToHandler(handler, envelope).catch((error) => {
        this.stats.failed++;
        this.dlq.push({
          topic,
          message: envelope.message,
          error: error.message,
          ts: Date.now(),
        });
      });
    }

    return envelope.id;
  }

  async deliverToHandler(handler, envelope) {
    try {
      await handler(envelope.message);
      this.stats.delivered++;
    } catch (error) {
      throw error;
    }
  }

  subscribe(topic, handler) {
    const subs = this.subscribers.get(topic) ?? [];
    subs.push(handler);
    this.subscribers.set(topic, subs);

    // Return unsubscribe function
    return () => {
      const updated = (this.subscribers.get(topic) ?? []).filter((h) => h !== handler);
      this.subscribers.set(topic, updated);
    };
  }

  subscribePattern(pattern, handler) {
    const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);

    const matchingTopics = [...this.topics.keys()].filter((t) => regex.test(t));

    const unsubs = [];
    for (const topic of matchingTopics) {
      unsubs.push(this.subscribe(topic, handler));
    }

    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }

  queueDepth(topic = null) {
    if (topic) {
      return (this.topics.get(topic) ?? []).length;
    }
    return [...this.topics.values()].reduce((sum, q) => sum + q.length, 0);
  }

  async drain(topic, { maxBatch = 100 } = {}) {
    const queue = this.topics.get(topic) ?? [];
    const batch = queue.splice(0, maxBatch);
    return batch;
  }

  drainDeadLetters({ limit = 100 } = {}) {
    return this.dlq.splice(0, limit);
  }

  async replay(topic, { fromTs = 0 } = {}) {
    const queue = this.topics.get(topic) ?? [];
    return queue.filter((m) => m.ts >= fromTs);
  }

  getStats() {
    return {
      ...this.stats,
      queueDepth: this.queueDepth(),
      dlqSize: this.dlq.length,
      topicCount: this.topics.size,
      subscriberCount: this.subscribers.size,
    };
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  reset() {
    this.topics.clear();
    this.subscribers.clear();
    this.dlq = [];
    this.stats = {
      published: 0,
      delivered: 0,
      failed: 0,
      dlqed: 0,
    };
  }
}
