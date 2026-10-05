class Observability {
  constructor(opts = {}) {
    const { metrics = null, tracer = null } = opts;
    this.metrics = metrics || new ConsoleMetrics();
    this.tracer = tracer || new ConsoleTracer();
  }

  startSpan(name, attrs = {}) {
    return this.tracer.startSpan(name, attrs);
  }

  recordMetric(name, value, labels = {}) {
    this.metrics.record(name, value, labels);
  }

  log(level, message, data = {}) {
    this.metrics.log(level, message, data);
  }
}

class ConsoleMetrics {
  record(name, value, labels = {}) {
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    console.log(`[metric] ${name}=${value} ${labelStr}`);
  }

  log(level, message, data = {}) {
    const ts = new Date().toISOString();
    console.log(`[${ts}] [${level}] ${message}`, JSON.stringify(data));
  }
}

class ConsoleTracer {
  startSpan(name, attrs = {}) {
    const start = Date.now();
    return {
      end: () => ({
        name,
        attrs,
        durationMs: Date.now() - start,
      }),
    };
  }
}

export { Observability, ConsoleMetrics, ConsoleTracer };
