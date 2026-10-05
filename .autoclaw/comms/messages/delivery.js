import { MessageEnvelope } from './envelope.js';

export class AtLeastOnceDelivery {
  constructor({ maxRetries = 3, retryDelayMs = 1000 } = {}) {
    this.maxRetries = maxRetries;
    this.retryDelayMs = retryDelayMs;
    this.inFlight = new Map();
    this.delivered = new Map();
  }

  async send(message, handler) {
    const envelope = new MessageEnvelope({ message });
    this.inFlight.set(envelope.id, envelope);

    let lastError = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        await handler(envelope.message);
        envelope.recordAttempt(true);
        this.inFlight.delete(envelope.id);
        this.delivered.set(envelope.idempotencyKey, envelope);
        return { success: true, envelope };
      } catch (error) {
        lastError = error;
        envelope.recordAttempt(false, error.message);

        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelayMs * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    this.inFlight.delete(envelope.id);
    envelope.status = 'failed';
    return { success: false, envelope, error: lastError };
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  isDelivered(idempotencyKey) {
    return this.delivered.has(idempotencyKey);
  }

  getInFlightCount() {
    return this.inFlight.size;
  }

  getDeliveredCount() {
    return this.delivered.size;
  }

  getStats() {
    return {
      inFlight: this.inFlight.size,
      delivered: this.delivered.size,
    };
  }

  reset() {
    this.inFlight.clear();
    this.delivered.clear();
  }
}
