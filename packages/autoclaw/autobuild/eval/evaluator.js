import { evalTracer } from "./traces/store.js";
import { scorers } from "./scorers.js";

/**
 * Evaluator — runs evaluation cases on artifacts.
 */
class Evaluator {
  constructor(opts = {}) {
    this.scorers = scorers;
  }

  async evaluate(cases, target) {
    const results = [];
    for (const testCase of cases) {
      const scorer = this.scorers[testCase.scorer] ?? this.scorers.default;
      const score = await scorer({ testCase, target });
      const pass = score >= (testCase.threshold ?? 0.8);

      // Store trace
      const trace = {
        id: testCase.id ?? crypto.randomUUID(),
        case: testCase,
        target,
        score,
        pass,
        evaluatorId: 'auto-1',
      };
      await evalTracer.store(trace);

      results.push({
        name: testCase.name ?? 'unnamed',
        pass,
        score,
        threshold: testCase.threshold ?? 0.8,
      });
    }
    return results;
  }
}

export { Evaluator };
export const evaluator = new Evaluator({ scorers });