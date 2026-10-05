export class AnomalyDetector {
  constructor({ sensitivity = 2.0 } = {}) {
    this.sensitivity = sensitivity;
    this.baselines = new Map();
  }

  async detect({ symptom, context, correlated }) {
    const anomalies = [];
    const baseline = this.baselines.get(symptom.type) ?? { mean: 0, std: 1 };
    const zScore = Math.abs((Date.now() - (context.timestamp ?? Date.now())) / (baseline.std || 1));

    if (zScore > this.sensitivity) {
      anomalies.push({
        metric: symptom.type,
        value: zScore,
        timestamp: Date.now(),
        severity: Math.min(zScore / 5, 1),
      });
    }

    return anomalies;
  }

  updateBaseline(type, value) {
    const current = this.baselines.get(type) ?? { mean: 0, std: 1, count: 0 };
    const n = current.count + 1;
    const delta = value - current.mean;
    const newMean = current.mean + delta / n;
    const newStd = Math.sqrt(((current.count * current.std ** 2 + delta * (value - newMean)) / n) || 1);
    this.baselines.set(type, { mean: newMean, std: newStd, count: n });
  }
}
