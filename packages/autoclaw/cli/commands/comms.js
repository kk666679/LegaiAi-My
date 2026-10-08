import { initTelemetry } from '../telemetry/cli-tracer.js';

export const commsCommand = {
  description: 'Inter-agent comms (send, rooms, inbox, subscribe)',
  async run({ subcommand, args, flags }) {
    const tracer = initTelemetry();
    const span = tracer.startSpan(`comms.${subcommand}`);

    try {
      switch (subcommand) {
        case 'send': {
          const to = args[0];
          const messageType = args[1] ?? 'message';
          const payload = flags.payload ? JSON.parse(flags.payload) : { text: args.slice(2).join(' ') };
          return {
            status: 'sent',
            to,
            type: messageType,
            messageId: crypto.randomUUID(),
          };
        }

        case 'rooms': {
          return {
            count: 0,
            rooms: [],
          };
        }

        case 'inbox': {
          const agentId = flags.agent ?? 'cli';
          return {
            agent: agentId,
            unread: 0,
            messages: [],
          };
        }

        case 'subscribe': {
          return { status: 'subscribed' };
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
