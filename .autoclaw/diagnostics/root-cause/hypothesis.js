export class HypothesisRanker {
  rank(hypotheses, { roots, knownPatterns, anomalies } = {}) {
    const list = hypotheses.hypotheses ?? hypotheses ?? [];
    return list
      .map((h) => ({
        ...h,
        confidence: this.adjustConfidence(h, { roots, knownPatterns, anomalies }),
      }))
      .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
  }

  adjustConfidence(h, { roots, knownPatterns, anomalies } = {}) {
    let confidence = h.confidence ?? 0.5;
    if (knownPatterns?.some((p) => h.cause?.toLowerCase().includes(p.cause?.toLowerCase() ?? ''))) {
      confidence = Math.min(1, confidence + 0.15);
    }
    if ((anomalies?.length ?? 0) >= 2) confidence = Math.min(1, confidence + 0.1);
    if ((roots?.length ?? 0) === 0) confidence *= 0.7;
    return confidence;
  }
}
