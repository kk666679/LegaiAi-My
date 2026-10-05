export class TraceLinker {
  constructor({ otelEndpoint = null } = {}) {
    this.otelEndpoint = otelEndpoint;
  }

  async link({ event, traceId }) {
    return {
      traces: traceId ? [{ traceId, linkedAt: Date.now() }] : [],
      spans: [],
    };
  }
}
