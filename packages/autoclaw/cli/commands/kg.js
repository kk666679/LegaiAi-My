import { initTelemetry } from '../telemetry/cli-tracer.js';

export const kgCommand = {
  description: 'Knowledge graph (query, insert, migrate)',
  async run({ subcommand, args, flags }) {
    const tracer = initTelemetry();
    const span = tracer.startSpan(`kg.${subcommand}`);

    try {
      switch (subcommand) {
        case 'query': {
          const [entity] = args;
          const depth = parseInt(flags.depth ?? 2, 10);
          return {
            entity,
            depth,
            results: [],
          };
        }

        case 'insert': {
          const [subject, predicate, object] = args;
          return {
            status: 'inserted',
            triple: { subject, predicate, object },
          };
        }

        case 'migrate': {
          return { status: 'migrated' };
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
