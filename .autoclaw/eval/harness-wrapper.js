import { runEval, DEFAULT_DIMENSIONS } from './runner-wrapper.js';

class EvalHarness {
  constructor({ scorers = ['exact-match'], reporters = ['console'], dimensions = DEFAULT_DIMENSIONS } = {}) {
    this.scorers = scorers;
    this.reporters = reporters;
    this.dimensions = dimensions;
  }

  async runSuite({ name, cases, target, targetType = 'agent' }) {
    const results = [];
    for (const testCase of cases) {
      const result = await runEval({ testCase, target, targetType, scorers: this.scorers, dimensions: this.dimensions });
      results.push(result);
    }

    const summary = {
      suite: name,
      target: target.name ?? target.id,
      targetType,
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      avgScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
      durationMs: results.reduce((sum, r) => sum + r.durationMs, 0),
      results,
    };

    return summary;
  }
}

export { EvalHarness };
