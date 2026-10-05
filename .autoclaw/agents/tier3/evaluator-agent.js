"use strict";
/**
 * agents/tier3/evaluator-agent.js — Tier 3: Evaluator agent for eval runs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { BaseAgent } = require('../base-agent');
const { EvalHarness } = require('../../eval/harness');
const { runRegression } = require('../../eval/regression');

class EvaluatorAgent extends BaseAgent {
  constructor() {
    super({
      id: 'evaluator-agent',
      role: 'evaluator',
      tier: 3,
      capabilities: ['eval.run', 'eval.compare', 'eval.report'],
    });
    this.harness = new EvalHarness({
      scorers: ['json-schema', 'tool-call', 'llm-judge'],
      reporters: ['json', 'markdown'],
    });
  }

  async runSuite({ suiteName, cases, target, targetType }) {
    return this.harness.runSuite({ name: suiteName, cases, target, targetType });
  }

  async compare({ suiteName, currentResults, baselinePath }) {
    return runRegression({ suite: suiteName, baselinePath, currentResults });
  }
}

exports.EvaluatorAgent = EvaluatorAgent;