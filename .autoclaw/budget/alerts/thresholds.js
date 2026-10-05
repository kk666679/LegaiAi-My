import { BudgetNotifier } from './notifier.js';

const THRESHOLDS = [0.5, 0.75, 0.9, 0.95, 1.0];

export class ThresholdWatcher {
  constructor({ scope, limit, notifier = null }) {
    this.scope = scope;
    this.limit = limit;
    this.notifier = notifier ?? new BudgetNotifier();
    this.fired = new Set();
  }

  async check(used) {
    const percent = used / this.limit;

    for (const t of THRESHOLDS) {
      if (percent >= t && !this.fired.has(t)) {
        this.fired.add(t);
        await this.fire(t, used);
      }
    }
  }

  async fire(threshold, used) {
    const severity =
      threshold >= 1.0
        ? 'critical'
        : threshold >= 0.9
          ? 'high'
          : threshold >= 0.75
            ? 'warning'
            : 'info';

    await this.notifier.notify({
      type: 'budget.threshold',
      scope: this.scope,
      threshold: Math.round(threshold * 100),
      used,
      limit: this.limit,
      severity,
    });
  }

  reset() {
    this.fired.clear();
  }
}
