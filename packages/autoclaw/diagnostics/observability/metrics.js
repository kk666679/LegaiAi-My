import { metrics } from '@opentelemetry/api';
const meter = metrics.getMeter('autoclaw-diagnostics');

const diagnosed = meter.createCounter('diagnostics_diagnosed_total');
const remediated = meter.createCounter('diagnostics_remediated_total');

export const diagMetrics = {
  increment(name, attributes = {}, value = 1) {
    const map = {
      'diagnostics.diagnosed': diagnosed,
      'diagnostics.remediated': remediated,
    };
    map[name]?.add(value, attributes);
  },
};
