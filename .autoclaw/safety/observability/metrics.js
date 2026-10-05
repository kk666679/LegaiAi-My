/**
 * .autoclaw/safety/observability/metrics.js
 * OpenTelemetry metrics for safety subsystem
 */

let metrics;

try {
  const otelMetrics = require('@opentelemetry/api').metrics;
  if (otelMetrics) {
    metrics = otelMetrics.getMeter('autoclaw-safety', '1.0.0');
  }
} catch {
  metrics = null;
}

const counters = new Map();
const histograms = new Map();
const gauges = new Map();

function getCounter(name) {
  if (!counters.has(name)) {
    if (metrics && metrics.createCounter) {
      counters.set(name, metrics.createCounter(name));
    } else {
      counters.set(name, { add: () => {} });
    }
  }
  return counters.get(name);
}

function getHistogram(name) {
  if (!histograms.has(name)) {
    if (metrics && metrics.createHistogram) {
      histograms.set(name, metrics.createHistogram(name));
    } else {
      histograms.set(name, { record: () => {} });
    }
  }
  return histograms.get(name);
}

function getGauge(name) {
  if (!gauges.has(name)) {
    if (metrics && metrics.createObservableGauge) {
      gauges.set(name, metrics.createObservableGauge(name));
    } else {
      gauges.set(name, { observe: () => {} });
    }
  }
  return gauges.get(name);
}

class SafetyMetrics {
  increment(name, attributes = {}, value = 1) {
    const counter = getCounter(name);
    counter.add?.(value, attributes);
  }

  histogram(name, value, attributes = {}) {
    const histogram = getHistogram(name);
    histogram.record?.(value, attributes);
  }

  gauge(name, value, attributes = {}) {
    const gauge = getGauge(name);
    gauge.observe?.(value, attributes);
  }
}

module.exports = {
  safetyMetrics: new SafetyMetrics(),
  metrics,
};
