import { scorers } from "./scorers.js";

/**
 * EvalHarness — runs continuous evaluation suites.
 */
class EvalHarness {
  constructor(opts = {}) {
    this.scorers = scorers;
  }

  async runSuite({ name, cases, target, targetType }) {
    const results = [];
    const total = cases.length;
    let passed = 0;

    for (const testCase of cases) {
      const result = await this.runCase(testCase, target, targetType);
      results.push(result);
      if (result.pass) passed++;
    }

    return {
      name,
      total,
      passed,
      failed: total - passed,
      results,
      score: total > 0 ? passed / total : 1,
    };
  }

  async runCase(testCase, target, targetType) {
    const scorer = this.scorers[testCase.scorer] || this.scorers.default;
    const score = await scorer({ testCase, target, targetType });
    const pass = score >= (testCase.threshold || 0.8);
    return {
      name: testCase.name || 'unnamed',
      pass,
      score,
      threshold: testCase.threshold || 0.8,
    };
  }
}

export { EvalHarness };
