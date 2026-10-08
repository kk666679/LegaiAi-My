export class CircuitBreaker {
  constructor({ failureThreshold = 5, successThreshold = 2, timeoutMs = 60000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.successThreshold = successThreshold;
    this.timeoutMs = timeoutMs;
    this.states = new Map();
  }

  async isOpen(agentId) {
    const state = this.states.get(agentId);
    if (!state) return false;

    if (state.state === 'open') {
      if (Date.now() - state.openedAt > this.timeoutMs) {
        state.state = 'half-open';
        state.successes = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(agentId) {
    const state = this.states.get(agentId) ?? this.initialState();
    if (state.state === 'half-open') {
      state.successes = (state.successes ?? 0) + 1;
      if (state.successes >= this.successThreshold) {
        this.states.set(agentId, this.initialState());
        return 'closed';
      }
    } else {
      state.failures = 0;
    }
    this.states.set(agentId, state);
  }

  recordFailure(agentId) {
    const state = this.states.get(agentId) ?? this.initialState();
    state.failures = (state.failures ?? 0) + 1;
    if (state.failures >= this.failureThreshold) {
      state.state = 'open';
      state.openedAt = Date.now();
    }
    this.states.set(agentId, state);
  }

  initialState() {
    return { state: 'closed', failures: 0, successes: 0, openedAt: null };
  }

  snapshot() {
    return Object.fromEntries(this.states);
  }
}
