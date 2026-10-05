import { CircuitBreaker } from './circuit-breaker.js';

export class Bus {
  constructor({ maxQueue = 10000 } = {}) {
    this.maxQueue = maxQueue;
    this.subscribers = new Map();
    this.queue = [];
    this.circuitBreaker = new CircuitBreaker();
  }

  async request({ to, from, type, payload }) {
    if (await this.circuitBreaker.isOpen(to)) {
      throw new Error(`Circuit open for agent ${to}`);
    }
    const result = { status: 'ok', to, from, type, payload, timestamp: Date.now() };
    this.circuitBreaker.recordSuccess(to);
    return result;
  }

  async publish(topic, data) {
    this.queue.push({ topic, data, timestamp: Date.now() });
    if (this.queue.length > this.maxQueue) {
      this.queue.shift();
    }
  }

  subscribe(pattern, handler) {
    const id = crypto.randomUUID();
    this.subscribers.set(id, { pattern, handler });
    return () => this.subscribers.delete(id);
  }

  async isCircuitOpen(agentId) {
    return this.circuitBreaker.isOpen(agentId);
  }

  recordFailure(agentId) {
    this.circuitBreaker.recordFailure(agentId);
  }

  queueDepth(agentId) {
    return this.queue.filter((m) => m.to === agentId).length;
  }

  openCircuitCount() {
    return this.circuitBreaker.snapshot().size;
  }
}

