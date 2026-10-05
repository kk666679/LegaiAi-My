"use strict";
/**
 * eval/harness.js — Evaluation harness for running test suites.
 *
 * Supports multi-dimensional evaluation aligned with AgencyBench, AgentGym2,
 * SQBench, and MultiCAT-Bench dimensions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { runEval, DEFAULT_DIMENSIONS } = require('./runner');
const { scorerRegistry } = require('./scorers/index');
const { consoleReporter } = require('./reporters/console');
const { jsonReporter } = require('./reporters/json');

class EvalHarness {
  constructor({ scorers = ['exact-match'], reporters = ['console'], dimensions = DEFAULT_DIMENSIONS } = {}) {
    this.scorers = scorers.map((s) => scorerRegistry.get(s));
    this.reporters = { console: consoleReporter, json: jsonReporter };
    this.selectedReporters = reporters;
    this.dimensions = dimensions;
  }

  async runSuite({ name, cases, target, targetType = 'agent' }) {
    const results = [];
    for (const testCase of cases) {
      const result = await runEval({ testCase, target, targetType, scorers: this.scorers, dimensions: this.dimensions });
      results.push(result);
    }

    // Compute dimension-level aggregates
    const dimensionAggregates = this.aggregateDimensions(results);

    const summary = {
      suite: name,
      target: target.name ?? target.id,
      targetType,
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      avgScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
      dimensionAggregates,
      durationMs: results.reduce((sum, r) => sum + r.durationMs, 0),
      results,
    };

    for (const reporterName of this.selectedReporters) {
      this.reporters[reporterName]?.report(summary);
    }

    return summary;
  }

  aggregateDimensions(results) {
    const dims = {};
    for (const result of results) {
      for (const [dim, score] of Object.entries(result.dimensionScores ?? {})) {
        if (!dims[dim]) dims[dim] = { sum: 0, count: 0, weight: score.weight };
        dims[dim].sum += score.value ?? 0;
        dims[dim].count++;
      }
    }

    const aggregates = {};
    for (const [dim, data] of Object.entries(dims)) {
      aggregates[dim] = {
        avgScore: data.sum / data.count,
        weight: data.weight,
      };
    }
    return aggregates;
  }
}

exports.EvalHarness = EvalHarness;