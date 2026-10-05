export class BackpressureController {
  constructor({ highWater = 1000, lowWater = 100 } = {}) {
    this.highWater = highWater;
    this.lowWater = lowWater;
    this.pressured = false;
    this.paused = new Map();
  }

  check(queueDepth) {
    if (!this.pressured && queueDepth >= this.highWater) {
      this.pressured = true;
      console.warn(`[backpressure] HIGH WATER MARK REACHED: queue depth ${queueDepth}`);
      return { action: 'pause', reason: 'high_water' };
    }

    if (this.pressured && queueDepth <= this.lowWater) {
      this.pressured = false;
      console.log(`[backpressure] LOW WATER MARK REACHED: queue depth ${queueDepth}`);
      return { action: 'resume', reason: 'low_water' };
    }

    return { action: 'none', reason: this.pressured ? 'pressured' : 'normal' };
  }

  pause(topic) {
    this.paused.set(topic, Date.now());
  }

  resume(topic) {
    this.paused.delete(topic);
  }

  isPaused(topic) {
    return this.paused.has(topic);
  }

  getPausedTopics() {
    return [...this.paused.keys()];
  }

  getStatus() {
    return {
      pressured: this.pressured,
      pausedCount: this.paused.size,
      pausedTopics: this.getPausedTopics(),
      highWater: this.highWater,
      lowWater: this.lowWater,
    };
  }

  reset() {
    this.pressured = false;
    this.paused.clear();
  }
}
