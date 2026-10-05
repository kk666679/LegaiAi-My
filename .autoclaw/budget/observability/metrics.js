// Simple in-memory metrics collector (OpenTelemetry integration stub)

class MetricsCollector {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
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

  histogram(name, value, attributes = {}) {
    const key = this.makeKey(name, attributes);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    this.histograms.get(key).push(value);
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
      histograms: Object.fromEntries(
        [...this.histograms.entries()].map(([k, values]) => [
          k,
          {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            min: Math.min(...values),
            max: Math.max(...values),
            mean: values.reduce((a, b) => a + b, 0) / values.length,
          },
        ])
      ),
    };
  }

  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

export const budgetMetrics = new MetricsCollector();
