import { CausalGraph } from './causal-graph.js';
import { CorrelationEngine } from './correlation.js';
import { HypothesisRanker } from './hypothesis.js';
import { diagTracer } from '../observability/tracer.js';

export class RootCauseAnalyzer {
  constructor({ kg }) {
    this.kg = kg;
    this.correlationEngine = new CorrelationEngine();
    this.hypothesisRanker = new HypothesisRanker();
  }

  async analyze({ symptom, classification, correlated, anomalies, context }) {
    return diagTracer.startSpan('diagnostics.rca', async (span) => {
      const graph = new CausalGraph();
      this.buildGraph(graph, { symptom, correlated, anomalies });

      const roots = graph.findRoots();
      span.setAttribute('rca.candidate_roots', roots.length);

      const knownPatterns = this.kg
        ? await this.kg.queryPatterns({ failureClass: classification.class, context })
        : [];

      const hypothesis = await this.synthesize({
        symptom,
        classification,
        graph: graph.toDOT(),
        roots,
        knownPatterns,
        correlated,
      });

      const ranked = this.hypothesisRanker.rank(hypothesis, { roots, knownPatterns, anomalies });

      return {
        rootCause: ranked[0]?.cause ?? 'unknown',
        confidence: ranked[0]?.confidence ?? 0,
        hypotheses: ranked,
        causalGraph: graph.toDOT(),
        knownPatterns,
      };
    });
  }

  buildGraph(graph, { symptom, correlated, anomalies }) {
    const symptomId = graph.addNode({
      id: 'symptom',
      type: 'symptom',
      signal: symptom.message,
      timestamp: Date.now(),
    });

    for (const trace of correlated.traces ?? []) {
      const traceId = graph.addNode({
        id: `trace:${trace.traceId}`,
        type: 'trace',
        signal: trace.name,
        timestamp: trace.startTime,
      });
      graph.addEdge(traceId, symptomId, { weight: 0.7, reason: 'trace-overlap' });
    }

    for (const anomaly of anomalies ?? []) {
      const aId = graph.addNode({
        id: `anomaly:${anomaly.metric}`,
        type: 'anomaly',
        signal: `${anomaly.metric}=${anomaly.value}`,
        timestamp: anomaly.timestamp,
      });
      graph.addEdge(aId, symptomId, { weight: anomaly.severity ?? 0.5, reason: 'anomaly' });
    }

    for (const mem of correlated.memories ?? []) {
      const mId = graph.addNode({
        id: `memory:${mem.id}`,
        type: 'memory',
        signal: mem.content.slice(0, 100),
        timestamp: mem.createdAt,
      });
      graph.addEdge(mId, symptomId, { weight: mem.salience ?? 0.5, reason: 'historical' });
    }
  }

  async synthesize({ symptom, classification, graph, roots, knownPatterns, correlated }) {
    const prompt = `You are a root cause analyst. Given a failure symptom, its causal graph, and prior patterns, determine the most likely root cause.

Failure class: ${classification.class}
Symptom: ${symptom.message}

Causal graph (DOT):
${graph}

Candidate roots: ${roots.join(', ')}

Known patterns:
${JSON.stringify(knownPatterns, null, 2)}

Related memories:
${(correlated.memories ?? []).slice(0, 3).map((m) => `- ${m.content.slice(0, 200)}`).join('\n')}

Return JSON:
{
  "hypotheses": [
    { "cause": "...", "confidence": 0-1, "evidence": ["..."], "reasoning": "..." }
  ]
}`.trim();

    try {
      const { complete } = await import('../../llm/complete.js');
      const result = await complete({ prompt, responseFormat: 'json', maxTokens: 800 });
      return typeof result === 'string' ? JSON.parse(result) : result;
    } catch {
      return {
        hypotheses: [
          {
            cause: 'unknown',
            confidence: 0.3,
            evidence: ['LLM synthesis failed'],
            reasoning: 'Fallback hypothesis due to LLM error',
          },
        ],
      };
    }
  }
}
