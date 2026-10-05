export class NoOpSpan {
  constructor(name) {
    this.name = name;
    this.attributes = {};
    this.events = [];
    this.status = { code: 0 };
  }

  setAttribute(key, value) {
    this.attributes[key] = value;
    return this;
  }

  setStatus(status) {
    this.status = status;
    return this;
  }

  addEvent(name, attributes = {}) {
    this.events.push({ name, attributes, timestamp: Date.now() });
    return this;
  }

  recordException(error) {
    this.events.push({
      name: 'exception',
      attributes: {
        'exception.type': error.constructor.name,
        'exception.message': error.message,
        'exception.stacktrace': error.stack,
      },
      timestamp: Date.now(),
    });
    return this;
  }

  end() {
    // No-op
  }
}

export class NoOpTracer {
  constructor(name) {
    this.name = name;
  }

  startSpan(name) {
    return new NoOpSpan(name);
  }
}

export function initTelemetry() {
  // For now, use no-op tracer. In production, this would wire to OpenTelemetry
  return new NoOpTracer('autoclaw-cli');
}
