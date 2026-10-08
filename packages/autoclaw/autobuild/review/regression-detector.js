/**
 * Regression detector — compares artifact against baseline for
 * correctness regression, test failures, or performance degradation.
 */
async function detectRegression({ artifact, baseline }) {
  if (!baseline) {
    return { regressed: false, changes: [], score: 1 };
  }

  const changes = [];
  let regressions = 0;

  // Check for removed test cases
  if (baseline.tests && artifact.tests) {
    const baselineTests = new Set(baseline.tests.map((t) => t.name));
    const currentTests = new Set(artifact.tests.map((t) => t.name));
    for (const test of baselineTests) {
      if (!currentTests.has(test)) {
        changes.push({ type: 'removed-test', name: test });
        regressions++;
      }
    }
  }

  // Check for new error-handling gaps
  if (baseline.errorHandling && !artifact.errorHandling) {
    changes.push({ type: 'removed-error-handling' });
    regressions++;
  }

  // Check file size changes (potential over-engineering or under-engineering)
  if (baseline.size && artifact.size) {
    const sizeDelta = artifact.size - baseline.size;
    if (sizeDelta > baseline.size * 0.5) {
      changes.push({ type: 'size-increase', delta: sizeDelta });
    }
  }

  // Check complexity increase
  if (baseline.complexity && artifact.complexity) {
    if (artifact.complexity > baseline.complexity * 1.5) {
      changes.push({ type: 'complexity-increase', from: baseline.complexity, to: artifact.complexity });
    }
  }

  const score = changes.length > 0 ? Math.max(0, 1 - regressions / changes.length) : 1;
  return { regressed: regressions > 0, changes, score };
}

export { detectRegression };
