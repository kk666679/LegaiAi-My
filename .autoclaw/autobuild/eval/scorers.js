/**
 * Scorers — evaluation functions for artifacts.
 */
const scorers = {
  /** Default scorer — checks basic pass/fail criteria. */
  async default({ testCase, target }) {
    if (!testCase.input) return 0.5;
    if (!target) return 0;
    // Compare output to expected
    if (testCase.expected !== undefined) {
      return target === testCase.expected ? 1 : 0.2;
    }
    return 0.8;
  },

  /** Exact match scorer. */
  async exact({ testCase, target }) {
    return testCase.expected === target ? 1 : 0;
  },

  /** Fuzzy match scorer (contains check). */
  async contains({ testCase, target }) {
    if (typeof target !== 'string') return 0;
    return target.includes(testCase.expected) ? 0.9 : 0.3;
  },

  /** Schema compliance scorer. */
  async schema({ testCase, target }) {
    if (!target || typeof target !== 'object') return 0;
    if (!testCase.schema) return 0.8;
    // Check required fields
    const missing = testCase.schema.filter(
      (field) => target[field] === undefined
    );
    return missing.length === 0 ? 1 : Math.max(0, 1 - missing.length * 0.2);
  },
};

export { scorers };
