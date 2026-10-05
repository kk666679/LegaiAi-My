"use strict";
/**
 * eval/regression.js — Regression detection against baselines.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs/promises');

async function runRegression({ suite, baselinePath, currentResults }) {
  const baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8'));

  const regressions = [];
  const improvements = [];

  for (const current of currentResults.results) {
    const base = baseline.results.find((r) => r.testCaseId === current.testCaseId);
    if (!base) continue;
    const delta = current.score - base.score;
    if (delta < -0.1) {
      regressions.push({ testCaseId: current.testCaseId, delta, baseline: base.score, current: current.score });
    } else if (delta > 0.1) {
      improvements.push({ testCaseId: current.testCaseId, delta, baseline: base.score, current: current.score });
    }
  }

  return {
    suite,
    regressions,
    improvements,
    verdict: regressions.length === 0 ? 'pass' : 'fail',
  };
}

async function saveBaseline({ suite, results, path }) {
  await fs.writeFile(path, JSON.stringify({ suite, ...results }, null, 2));
}

exports.runRegression = runRegression;
exports.saveBaseline = saveBaseline;