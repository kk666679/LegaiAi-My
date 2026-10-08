import { metrics } from '@opentelemetry/api';
const meter = metrics.getMeter('autoclaw-evidence');

const captured = meter.createCounter('evidence_captured_total');

export const evidenceMetrics = {
  increment(name, attributes = {}, value = 1) {
    const map = {
      'evidence.captured': captured,
    };
    map[name]?.add(value, attributes);
  },
};
