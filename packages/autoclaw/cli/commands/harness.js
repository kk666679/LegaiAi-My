import { EvalHarness } from '../../harness/index.js';
import { initTelemetry } from '../telemetry/cli-tracer.js';

export const harnessCommand = {
  description: 'Test harness (run, replay, inspect)',
  async run({ subcommand, args, flags }) {
    const tracer = initTelemetry();
    const span = tracer.startSpan(`harness.${subcommand}`);

    try {
      const harness = new EvalHarness();

      switch (subcommand) {
        case 'run': {
          const [suite] = args;
          return await harness.runSuite({ path: suite });
        }

        case 'replay': {
          const [runId] = args;
          return await harness.replay({ runId });
        }

        case 'inspect': {
          const [resultId] = args;
          return await harness.inspect({ resultId });
        }

        default:
          throw new Error(`Unknown subcommand: ${subcommand}`);
      }
    } catch (error) {
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  },
};
