import { BuildHarness } from "../harness/runtime.js";
import { TieredRouter } from "../routing/tiered-router.js";
import { EvalHarness } from "../eval/harness.js";
import { reviewArtifact } from "../review/reasoner-wiring.js";

class BuildPipeline {
  constructor(opts = {}) {
    this.harness = new BuildHarness(opts);
    this.router = new TieredRouter(opts);
    this.eval = new EvalHarness(opts);
    this.review = reviewArtifact;
  }

  async run({ goal, context, constraints }) {
    // 1. Plan
    const plan = await this.harness.agent.plan(goal, context);

    // 2. Execute with harness
    const result = await this.harness.run(goal, { plan, context });

    // 3. Eval
    const evalSummary = await this.eval.runSuite({
      name: `build-${goal}`,
      cases: context.testCases || [],
      target: result.artifact,
      targetType: 'artifact',
    });

    // 4. Review
    const reviewResult = await reviewArtifact({
      artifact: result.artifact,
      goal,
      baseline: context.baseline,
    });

    // 5. Promote if approved
    if (reviewResult.verdict === 'approve' && evalSummary.passed === evalSummary.total) {
      return { status: 'promoted', result, evalSummary, review: reviewResult };
    }
    if (reviewResult.verdict === 'revise') {
      return {
        status: 'revise',
        result,
        evalSummary,
        review: reviewResult,
        feedback: reviewResult.consensus.feedback,
      };
    }
    return { status: 'rejected', result, evalSummary, review: reviewResult };
  }
}

export { BuildPipeline };