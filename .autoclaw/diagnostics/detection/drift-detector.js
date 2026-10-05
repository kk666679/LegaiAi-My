export class DriftDetector {
  constructor({ windowSize = 100, threshold = 0.1 } = {}) {
    this.windowSize = windowSize;
    this.threshold = threshold;
    this.history = [];
  }

  detect(value) {
    this.history.push(value);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }
    if (this.history.length < 10) return { drift: false };

    const mean = this.history.reduce((a, b) => a + b, 0) / this.history.length;
    const variance = this.history.reduce((a, b) => a + (b - mean) ** 2, 0) / this.history.length;
    const std = Math.sqrt(variance);
    const last = this.history[this.history.length - 1];
    const zScore = std > 0 ? Math.abs((last - mean) / std) : 0;

    return { drift: zScore > this.threshold, zScore, mean, std };
  }
}
