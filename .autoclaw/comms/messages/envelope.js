import { Message } from './message.js';

export class MessageEnvelope {
  constructor({ message, idempotencyKey = null, spanContext = null }) {
    if (!(message instanceof Message)) {
      message = new Message(message);
    }

    this.id = `env-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    this.message = message;
    this.idempotencyKey = idempotencyKey ?? message.id;
    this.spanContext = spanContext;
    this.ts = Date.now();
    this.attempts = 0;
    this.status = 'pending';
    this.lastAttempt = null;
    this.lastError = null;
  }

  recordAttempt(success = false, error = null) {
    this.attempts++;
    this.lastAttempt = Date.now();
    if (success) {
      this.status = 'delivered';
    } else if (error) {
      this.lastError = error;
      this.status = this.attempts >= 3 ? 'failed' : 'pending';
    }
  }

  isRetryable() {
    return this.status === 'pending' && this.attempts < 3;
  }

  toJSON() {
    return {
      id: this.id,
      message: this.message.toJSON(),
      idempotencyKey: this.idempotencyKey,
      ts: this.ts,
      attempts: this.attempts,
      status: this.status,
      lastAttempt: this.lastAttempt,
      lastError: this.lastError,
    };
  }

  static fromJSON(json) {
    const envelope = new MessageEnvelope({
      message: Message.fromJSON(json.message),
      idempotencyKey: json.idempotencyKey,
    });
    envelope.id = json.id;
    envelope.ts = json.ts;
    envelope.attempts = json.attempts;
    envelope.status = json.status;
    envelope.lastAttempt = json.lastAttempt;
    envelope.lastError = json.lastError;
    return envelope;
  }
}
