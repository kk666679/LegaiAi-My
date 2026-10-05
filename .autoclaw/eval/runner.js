"use strict";
/**
 * eval/runner.js — Execute a single eval case against a target.
 *
 * Supports multi-dimensional harness evaluation aligned with AgencyBench,
 * AgentGym2, SQBench, and MultiCAT-Bench dimensions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { performance } = require('perf_hooks');

// Default evaluation dimensions from 2026 benchmarks
const DEFAULT_DIMENSIONS = {
  task_completion: 0.30,      // Did it achieve the goal?
  tool_correctness: 0.20,     // Were the right tools called correctly?
  resource_efficiency: 0.15,  // Tokens, time, cost within budget?
  self_correction: 0.15,      // Did it recover from errors?
  output_quality: 0.10,       // LLM-judge scored
  safety: 0.10,               // No policy violations
};

async function runEval({ testCase, target, targetType, scorers, dimensions = DEFAULT_DIMENSIONS }) {
  const start = performance.now();

  let output;
  let error = null;
  let trace = [];

  try {
    if (targetType === 'agent') {
      const result = await target.run(testCase.goal, testCase.context ?? {});
      output = result;
      trace = result.trace ?? [];
    } else if (targetType === 'skill') {
      output = await target.invoke(testCase.input, testCase.context ?? {});
    } else if (targetType === 'function') {
      output = await target(testCase.input);
    } else if (targetType === 'harness') {
      // Full harness evaluation
      output = await target.run(testCase.goal, testCase.context ?? {});
      trace = output.trace ?? [];
    }
  } catch (e) {
    error = e.message;
  }

  const durationMs = performance.now() - start;

  // Multi-dimensional scoring
  const dimensionScores = {};
  for (const [dim, weight] of Object.entries(dimensions)) {
    const scorer = scorers.find(s => s.dimension === dim);
    if (scorer) {
      const score = await scorer.score({
        input: testCase.input ?? testCase.goal,
        output,
        expected: testCase.expected,
        error,
        testCase,
        trace,
        dimensions,
      });
      dimensionScores[dim] = { ...score, weight };
    }
  }

  // Compute weighted average
  const weightedScore = Object.entries(dimensionScores).reduce(
    (sum, [dim, score]) => sum + (score.value ?? 0) * (score.weight ?? 0),
    0
  );

  // Overall pass: weighted score >= threshold AND no error
  const passed = weightedScore >= (testCase.threshold ?? 0.7) && !error;

  return {
    testCaseId: testCase.id,
    passed,
    score: weightedScore,
    dimensionScores,
    output,
    error,
    durationMs,
    trace: trace.slice(-10), // Keep last 10 trace entries
  };
}

exports.runEval = runEval;
exports.DEFAULT_DIMENSIONS = DEFAULT_DIMENSIONS;