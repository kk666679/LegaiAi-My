export class PatternRecognizer {
  constructor() {
    this.patterns = [
      { id: 'p1', pattern: /timeout/, signature: 'latency_spike' },
      { id: 'p2', pattern: /OOM/, signature: 'memory_exhaustion' },
      { id: 'p3', pattern: /ECONNREFUSED/, signature: 'connection_refused' },
    ];
  }

  recognize(symptom) {
    const text = `${symptom.message ?? ''} ${symptom.stack ?? ''}`;
    return this.patterns.filter((p) => p.pattern.test(text));
  }
}
