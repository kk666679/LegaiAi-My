/**
 * Detect stalled build runs by tracking progress signals.
 * Feeds into health state machine → recovery pipeline.
 */
class StallDetector {
  constructor({ heartbeatConfig = {}, onStall = () => {} } = {}) {
    this.config = heartbeatConfig;
    this.onStall = onStall;
    this.runs = new Map();
  }

  register(runId) {
    this.runs.set(runId, {
      lastSignalAt: Date.now(),
      lastTurn: 0,
      consecutiveNoProgress: 0,
    });
  }

  recordSignal(runId, { turn, progress }) {
    const state = this.runs.get(runId);
    if (!state) return;
    if (turn > state.lastTurn || progress > 0) {
      state.lastSignalAt = Date.now();
      state.lastTurn = turn;
      state.consecutiveNoProgress = 0;
    } else {
      state.consecutiveNoProgress++;
    }
  }

  tick() {
    const now = Date.now();
    for (const [runId, state] of this.runs) {
      const idleMs = now - state.lastSignalAt;
      if (idleMs > this.config.stallTimeoutMs) {
        this.onStall({ runId, idleMs, state });
      }
    }
  }

  start() {
    this.timer = setInterval(() => this.tick(), this.config.checkIntervalMs || 30000);
  }

  stop() {
    clearInterval(this.timer);
  }
}

export { StallDetector };
