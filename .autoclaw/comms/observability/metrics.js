class CommsMetrics {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
  }

  increment(name, attributes = {}, value = 1) {
    const key = this.makeKey(name, attributes);
    const current = this.counters.get(key) ?? 0;
    this.counters.set(key, current + value);
  }

  gauge(name, value, attributes = {}) {
    const key = this.makeKey(name, attributes);
    this.gauges.set(key, value);
  }

  makeKey(name, attributes) {
    const parts = [name];
    for (const [k, v] of Object.entries(attributes)) {
      parts.push(`${k}=${v}`);
    }
    return parts.join('|');
  }

  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
    };
  }

  reset() {
    this.counters.clear();
    this.gauges.clear();
  }
}

export const commsMetrics = new CommsMetrics();
