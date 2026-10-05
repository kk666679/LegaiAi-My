import { BridgeMetrics } from "./tracer.js";

class Metrics {
  constructor() {
    this.metrics = new BridgeMetrics();
  }

  record(name, value, labels = {}) {
    this.metrics.record(name, value, labels);
  }

  increment(name, amount = 1) {
    this.metrics.increment(name, amount);
  }

  getReport() {
    return this.metrics.getReport();
  }
}

export { Metrics };
