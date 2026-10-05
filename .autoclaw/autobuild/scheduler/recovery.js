import { defaultHeartbeatConfig } from "./heartbeat.js";

/**
 * Recovery — executes configured recovery strategies for stalled runs.
 */
class RecoveryManager {
  constructor(opts = {}) {
    this.config = config;
    this.onRecovery = onRecovery;
    this.attempts = new Map();
  }

  async recover({ runId, error }) {
    const existing = this.attempts.get(runId) || 0;
    if (existing >= this.config.maxRecoveryAttempts) {
      return { success: false, exhausted: true };
    }

    const strategy = this.selectStrategy();
    const attempt = existing + 1;
    this.attempts.set(runId, attempt);

    let result = null;
    switch (strategy.name) {
      case 'retry_same':
        result = await this.retrySame(runId, error);
        break;
      case 'escalate_model':
        result = await this.escalateModel(runId, error);
        break;
      case 'decompose_task':
        result = await this.decomposeTask(runId, error);
        break;
      case 'human_escalation':
        result = await this.escalateHuman(runId, error);
        break;
      default:
        result = await this.retrySame(runId, error);
    }

    if (this.onRecovery) {
      this.onRecovery({ runId, attempt, strategy, result, error });
    }

    return { success: result, attempt };
  }

  selectStrategy() {
    const totalWeight = this.config.recoveryStrategies.reduce(
      (sum, s) => sum + s.weight,
      0
    );
    let roll = Math.random() * totalWeight;
    for (const strategy of this.config.recoveryStrategies) {
      roll -= strategy.weight;
      if (roll <= 0) return strategy;
    }
    return this.config.recoveryStrategies[0];
  }

  async retrySame(runId, error) {
    return {
      action: 'retry_same',
      message: `Retrying same task after error: ${error && error.message ? error.message : 'unknown error'}`,
    };
  }

  async escalateModel(runId, error) {
    return {
      action: 'escalate_model',
      message: `Escalating to primary model after error: ${error && error.message ? error.message : 'unknown error'}`,
    };
  }

  async decomposeTask(runId, error) {
    return {
      action: 'decompose_task',
      message: `Decomposing task into subtasks after error: ${error && error.message ? error.message : 'unknown error'}`,
    };
  }

  async escalateHuman(runId, error) {
    return {
      action: 'human_escalation',
      message: `Manual intervention required after error: ${error && error.message ? error.message : 'unknown error'}`,
    };
  }
}

export { RecoveryManager };
