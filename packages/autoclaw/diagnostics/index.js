import { Classifier } from './classification/classifier.js';
import { RootCauseAnalyzer } from './root-cause/analyzer.js';
import { AnomalyDetector } from './detection/anomaly-detector.js';
import { RemediationExecutor } from './remediation/executor.js';
import { OtelLinker } from './correlation/otel-linker.js';
import { FailureKG } from './knowledge/failure-kg.js';
import { diagTracer } from './observability/tracer.js';
import { diagMetrics } from './observability/metrics.js';

export class Diagnostics {
  constructor({ config = {} } = {}) {
    this.classifier = new Classifier();
    this.rca = new RootCauseAnalyzer({ kg: new FailureKG({ path: config.kgPath ?? '.autoclaw/kg/kg.db' }) });
    this.anomaly = new AnomalyDetector({ sensitivity: config.sensitivity ?? 2.0 });
    this.remediation = new RemediationExecutor({ requireApproval: config.requireApproval ?? true });
    this.linker = new OtelLinker({ otelEndpoint: config.otelEndpoint });
  }

  async diagnose({ symptom, context = {}, trace = null }) {
    return diagTracer.startSpan('diagnostics.diagnose', async (span) => {
      span.setAttribute('symptom.type', symptom.type);
      span.setAttribute('symptom.source', symptom.source ?? 'unknown');

      const classification = await this.classifier.classify(symptom, context);
      span.setAttribute('failure.class', classification.class);
      span.setAttribute('failure.severity', classification.severity);

      const correlated = await this.linker.correlate({ symptom, classification, trace });
      span.setAttribute('correlation.traces', correlated.traces.length);
      span.setAttribute('correlation.memories', correlated.memories.length);

      const anomalies = await this.anomaly.detect({ symptom, context, correlated });
      span.setAttribute('anomalies.count', anomalies.length);

      const rca = await this.rca.analyze({
        symptom,
        classification,
        correlated,
        anomalies,
        context,
      });
      span.setAttribute('rca.confidence', rca.confidence);
      span.setAttribute('rca.root_cause', rca.rootCause);

      const recommendation = await this.remediation.recommend({ rca, context });
      diagMetrics.increment('diagnostics.diagnosed', { class: classification.class });

      return {
        classification,
        correlated,
        anomalies,
        rca,
        recommendation,
        traceId: span.spanContext().traceId,
      };
    });
  }

  async remediate({ diagnosis, approvalToken = null, actor }) {
    return diagTracer.startSpan('diagnostics.remediate', async (span) => {
      span.setAttribute('rca.root_cause', diagnosis.rca.rootCause);
      span.setAttribute('remediation.action', diagnosis.recommendation.action);

      const requiresApproval = diagnosis.recommendation.destructive;
      if (requiresApproval && !approvalToken) {
        span.setAttribute('remediation.status', 'approval_required');
        return { status: 'approval_required', diagnosis };
      }

      const result = await this.remediation.execute({
        diagnosis,
        actor,
        approvalToken,
      });

      span.setAttribute('remediation.status', result.status);
      diagMetrics.increment('diagnostics.remediated', { action: diagnosis.recommendation.action });
      return result;
    });
  }

  async learn({ diagnosis, outcome, actor }) {
    return this.rca.kg.record({ diagnosis, outcome, actor });
  }
}

export function createDiagnostics(config) {
  return new Diagnostics(config);
}
