import { BaseAgent } from '../base-agent.js';
import { EvalHarness } from '../../eval/harness.js';
import { runRegression } from '../../eval/regression.js';

/**
 * agents/tier3/evaluator-agent.js — Tier 3: Evaluator agent for eval runs.
 */
Object.defineProperty(exports, "__esModule", { value: true });

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

export { EvaluatorAgent as EvaluatorAgent };
