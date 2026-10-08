export class OtelLinker {
  constructor({ otelEndpoint = null } = {}) {
    this.otelEndpoint = otelEndpoint;
  }

  async correlate({ symptom, classification, trace }) {
    const traces = trace ? [trace] : [];
    const memories = [];

    if (classification.class) {
      memories.push({
        id: `diag-${Date.now()}`,
        content: `Previous ${classification.class} failure`,
        salience: 0.5,
        createdAt: Date.now(),
      });
    }

    return { traces, memories };
  }
}
