import { toolResult, toolError } from '../protocol.js';


function build({ obs } = {}) {
  return [
    {
      name: 'metrics_render',
      description: 'Render Prometheus text for the current metrics registry.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => {
        if (!obs || !obs.metrics) return toolError('observability unavailable');
        return toolResult([{ type: 'text', text: obs.metrics.renderPrometheus() }]);
      }
    },
    {
      name: 'metrics_snapshot',
      description: 'Return counters + gauges + histogram summaries as JSON.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => obs && obs.metrics
        ? toolResult([{ type: 'text', text: JSON.stringify(obs.metrics.snapshot(), null, 2) }])
        : toolError('observability unavailable')
    }
  ];
}
;

export { build };
