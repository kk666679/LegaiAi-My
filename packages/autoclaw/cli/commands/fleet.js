import { initTelemetry } from '../telemetry/cli-tracer.js';

export const fleetCommand = {
  description: 'Fleet management (start, stop, status, watch)',
  async run({ subcommand, args, flags }) {
    const tracer = initTelemetry();
    const span = tracer.startSpan(`fleet.${subcommand}`);

    try {
      switch (subcommand) {
        case 'start': {
          const template = args[0] ?? 'default';
          return {
            status: 'started',
            template,
            agents: [],
          };
        }

        case 'stop': {
          return { status: 'stopped' };
        }

        case 'status': {
          return {
            status: 'running',
            agents: [],
            uptime: 0,
          };
        }

        case 'watch': {
          return { status: 'watching' };
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
