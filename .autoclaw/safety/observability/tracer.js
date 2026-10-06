/**
 * .autoclaw/safety/observability/tracer.js
 * OpenTelemetry tracing for safety subsystem
 */

let trace;
let context;

try {
  await import('@opentelemetry/api');
  trace = otel.trace;
  context = otel.context;
} catch {
  trace = null;
  context = null;
}

const tracer = trace ? trace.getTracer('autoclaw-safety', '1.0.0') : null;

class SafetyTracer {
  async startSpan(spanName, fn) {
    if (!tracer) {
      return fn({
        setAttribute: () => {},
        recordException: () => {},
        end: () => {},
      });
    }

    return tracer.startActiveSpan(spanName, async (span) => {
      try {
        const result = await fn(span);
        return result;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2 });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  createSpan(name, attributes = {}) {
    if (!tracer) {
      return {
        setAttribute: () => {},
        recordException: () => {},
        end: () => {},
      };
    }

    const span = tracer.startSpan(name);
    for (const [key, value] of Object.entries(attributes)) {
      span.setAttribute(key, value);
    }
    return span;
  }
}

;

export { tracer, context };
