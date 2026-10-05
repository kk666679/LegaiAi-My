/**
 * BridgeTracer — traces bridge operations for observability.
 */
class BridgeTracer {
  constructor({ prefix = 'bridge' } = {}) {
    this.prefix = prefix;
    this.spans = new Map();
  }

  record(name, data = {}) {
    const span = {
      name,
      data,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    };
    this.spans.set(span.id, span);
    return span;
  }

  startSpan(name, attrs = {}) {
    const span = {
      name,
      attrs,
      startTime: Date.now(),
    };
    this.spans.set(name, span);
    return {
      end: (result) => {
        span.endTime = Date.now();
        span.result = result;
        span.durationMs = span.endTime - span.startTime;
      },
    };
  }

  getSpans() {
    return Array.from(this.spans.values());
  }

  clear() {
    this.spans.clear();
  }
}

/**
 * BridgeMetrics — bridge performance metrics.
 */
class BridgeMetrics {
  constructor() {
    this.counters = {};
    this.timers = {};
    this.gauges = {};
  }

  increment(name, amount = 1) {
    if (!this.counters[name]) {
      this.counters[name] = 0;
    }
    this.counters[name] += amount;
  }

  recordTiming(name, ms) {
    if (!this.timers[name]) {
      this.timers[name] = [];
    }
    this.timers[name].push(ms);
  }

  setGauge(name, value) {
    this.gauges[name] = value;
  }

  getReport() {
    return {
      counters: { ...this.counters },
      timers: Object.fromEntries(
        Object.entries(this.timers).map(([k, v]) => [
          k,
          { count: v.length, avg: v.reduce((a, b) => a + b, 0) / v.length },
        ])
      ),
      gauges: { ...this.gauges },
    };
  }
}

export { BridgeTracer };
export { BridgeMetrics };
