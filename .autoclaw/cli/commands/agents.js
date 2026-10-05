import { agentRegistry } from '../../agents/registry.js';
import { initTelemetry } from '../telemetry/cli-tracer.js';

export const agentsCommand = {
  description: 'Manage agents (list, run, stats, inspect)',
  async run({ subcommand, args, flags }) {
    const tracer = initTelemetry();
    const span = tracer.startSpan(`agents.${subcommand}`);

    try {
      switch (subcommand) {
        case 'list': {
          const agents = await agentRegistry.list();
          return { agents };
        }

        case 'run': {
          const [agentName, task] = args;
          const agent = await agentRegistry.get(agentName);
          const result = await agent.run(task);
          return { result };
        }

        case 'stats': {
          const [agentName] = args;
          const stats = await agentRegistry.stats(agentName);
          return { stats };
        }

        case 'inspect': {
          const [agentName] = args;
          const info = await agentRegistry.inspect(agentName);
          return { info };
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
