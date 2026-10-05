import { BudgetEnforcer } from '../../budget/index.js';
import { initTelemetry } from '../telemetry/cli-tracer.js';

export const budgetCommand = {
  description: 'Budget management (status, set, reset, forecast, ledger)',
  async run({ subcommand, args, flags }) {
    const tracer = initTelemetry();
    const span = tracer.startSpan(`budget.${subcommand}`);

    try {
      const enforcer = new BudgetEnforcer({ config: {} });

      switch (subcommand) {
        case 'status': {
          const summary = await enforcer.summary({ window: flags.window ?? '24h' });
          return {
            status: 'ok',
            ...summary,
          };
        }

        case 'set': {
          // autoclaw budget set --per-run 2.00 --per-agent-day 100.00 --global-day 500.00
          const config = {};
          if (flags['per-run']) config.perRun = parseFloat(flags['per-run']);
          if (flags['per-agent-day']) config.perAgentDay = parseFloat(flags['per-agent-day']);
          if (flags['global-day']) config.globalDay = parseFloat(flags['global-day']);
          return { status: 'configured', config };
        }

        case 'reset': {
          const scope = args[0] ?? 'global';
          return { status: 'reset', scope };
        }

        case 'forecast': {
          const window = args[0] ?? '24h';
          return { window, status: 'forecast not implemented' };
        }

        case 'ledger': {
          const agentId = flags.agent ?? 'all';
          const since = flags.since ? new Date(flags.since).getTime() : 0;
          const limit = parseInt(flags.limit ?? 1000, 10);
          const entries = await enforcer.ledger.get({ agentId, since, limit });
          return {
            agentId,
            count: entries.length,
            entries: entries.map((e) => ({
              ts: e.ts,
              agentId: e.agentId,
              cost: e.cost,
              model: e.model,
            })),
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
