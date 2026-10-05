// .autoclaw/eval/evaluation-framework.js
// ESM. Exports required by tests/autoclaw/evaluation-framework.test.js.

/**
 * @typedef {Object} CaseResult
 * @property {string} [id]
 * @property {boolean} [passed]
 * @property {number} [score]
 * @property {number} [latencyMs]
 * @property {string} [error]
 */

/** Build a metrics snapshot from an array of case results. */
export function buildMetricsSnapshot(results = []) {
  const total = results.length;
  const passed = results.filter((r) => r && r.passed).length;
  const failed = total - passed;
  const errored = results.filter((r) => r && r.error).length;
  const passRate = total ? passed / total : 0;
  const avgScore = total
    ? results.reduce((s, r) => s + (r?.score ?? 0), 0) / total
    : 0;
  const avgLatencyMs = total
    ? results.reduce((s, r) => s + (r?.latencyMs ?? 0), 0) / total
    : 0;

  return {
    total,
    passed,
    failed,
    errored,
    passRate,
    avgScore,
    avgLatencyMs,
    generatedAt: new Date().toISOString(),
  };
}

export class EvaluationFramework {
  constructor(config = {}) {
    this.config = config;
    this.results = [];
  }
  record(result) {
    this.results.push(result);
    return result;
  }
  async evaluate(_input) {
    return { score: 0, metrics: buildMetricsSnapshot(this.results), passed: false };
  }
  snapshot() {
    return buildMetricsSnapshot(this.results);
  }
  summary() {
    return this.snapshot();
  }
  reset() {
    this.results = [];
  }
}

export function createEvaluationFramework(config) {
  return new EvaluationFramework(config);
}

export default {
  buildMetricsSnapshot,
  EvaluationFramework,
  createEvaluationFramework,
};
