export class CorrelationEngine {
  constructor() {
    this.correlations = [];
  }

  correlate(symptom, signals) {
    const result = {
      symptom,
      traces: signals.traces ?? [],
      memories: signals.memories ?? [],
      score: 0,
    };
    result.score = this.computeScore(result);
    this.correlations.push(result);
    return result;
  }

  computeScore(correlation) {
    let score = 0;
    score += (correlation.traces?.length ?? 0) * 0.3;
    score += (correlation.memories?.length ?? 0) * 0.2;
    return Math.min(score, 1.0);
  }
}
