/**
 * Executor — executes plan steps within the harness.
 */
class Executor {
  constructor(opts = {}) {
    this.harness = harness;
  }

  async execute({ step, context }) {
    const result = await this.harness.run(step.description, {
      parentContext: context,
    });

    return {
      step: step.id,
      status: result.status,
      artifact: result.artifact,
      turns: result.turn,
    };
  }
}

export { Executor };
