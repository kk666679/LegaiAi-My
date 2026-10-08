/**
 * .autoclaw/safety/observability/metrics.js
 * OpenTelemetry metrics for safety subsystem
 */

let meter;

try {
  const { metrics } = await import('@opentelemetry/api');
  meter = metrics.getMeter('autoclaw-safety', '1.0.0');
} catch {
  meter = null;
}

const counters = new Map();
const histograms = new Map();
const gauges = new Map();

function getCounter(name) {
  if (!counters.has(name)) {
    if (meter && meter.createCounter) {
      counters.set(name, meter.createCounter(name));
    } else {
      counters.set(name, { add: () => {} });
    }
  }
  return counters.get(name);
}

function getHistogram(name) {
  if (!histograms.has(name)) {
    if (meter && meter.createHistogram) {
      histograms.set(name, meter.createHistogram(name));
    } else {
      histograms.set(name, { record: () => {} });
    }
  }
  return histograms.get(name);
}

function getGauge(name) {
  if (!gauges.has(name)) {
    if (meter && meter.createObservableGauge) {
      gauges.set(name, meter.createObservableGauge(name));
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

const safetyMetrics = new SafetyMetrics();

export { SafetyMetrics, safetyMetrics };
