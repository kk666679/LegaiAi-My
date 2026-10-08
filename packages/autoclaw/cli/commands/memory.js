import { createMemory } from '../../memory/index.js';
import { initTelemetry } from '../telemetry/cli-tracer.js';

export const memoryCommand = {
  description: 'Inspect and manage agent memory (recall, consolidate, stats)',
  async run({ subcommand, args, flags }) {
    const tracer = initTelemetry();
    const span = tracer.startSpan(`memory.${subcommand}`);

    try {
      const memory = createMemory({
        agentId: flags.agent ?? 'cli',
        namespace: flags.namespace ?? 'cli',
      });

      switch (subcommand) {
        case 'recall': {
          const query = args.join(' ');
          return memory.recall(query, { deep: true, limit: flags.limit ?? 10 });
        }

        case 'consolidate': {
          return memory.consolidate({ force: flags.force });
        }

        case 'stats': {
          const ltmStats = await import('../../memory/ltm/index.js').then((m) => m.stats());
          return {
            stm: memory.stm?.snapshot?.() ?? { items: 0 },
            ltm: ltmStats,
          };
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
