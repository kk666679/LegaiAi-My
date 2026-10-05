import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('autoclaw-evidence');

export const evidenceTracer = {
  startSpan(name, fn) {
    return tracer.startActiveSpan(name, async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: 0 });
        return result;
      } catch (err) {
        span.setStatus({ code: 2, message: err.message });
        throw err;
      } finally {
        span.end();
      }
    });
  },
};
