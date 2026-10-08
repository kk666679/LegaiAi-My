export class NoOpSpan {
  constructor(name) {
    this.name = name;
    this.attributes = {};
  }

  setAttribute(key, value) {
    this.attributes[key] = value;
    return this;
  }

  setStatus(status) {
    this.status = status;
    return this;
  }

  recordException(error) {
    this.error = error;
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

  startSpan(name, callback) {
    const span = new NoOpSpan(name);
    if (callback) {
      return callback(span);
    }
    return span;
  }
}

export const cloudTracer = new NoOpTracer('autoclaw-cloud');
