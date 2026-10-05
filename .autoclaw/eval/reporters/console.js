"use strict";
/**
 * eval/reporters/console.js — Console reporter.
 */
Object.defineProperty(exports, "__esModule", { value: true });

const consoleReporter = {
  report(summary) {
    console.log(`\n=== Eval Suite: ${summary.suite} ===`);
    console.log(`Target: ${summary.target} (${summary.targetType})`);
    console.log(`Passed: ${summary.passed}/${summary.total} | Avg Score: ${summary.avgScore.toFixed(2)} | Duration: ${summary.durationMs}ms`);
    for (const r of summary.results) {
      const status = r.passed ? '✓' : '✗';
      console.log(`  ${status} ${r.testCaseId}: score=${r.score.toFixed(2)} (${r.durationMs}ms)`);
      if (!r.passed) {
        console.log(`    Error: ${r.error || 'Below threshold'}`);
        for (const s of r.scores) {
          console.log(`    ${s.scorer}: ${s.value.toFixed(2)} - ${s.detail}`);
        }
      }
    }
  },
};

exports.consoleReporter = consoleReporter;