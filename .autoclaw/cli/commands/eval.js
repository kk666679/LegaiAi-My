import { EvalHarness } from '../../eval/harness.js';
import { agentRegistry } from '../../agents/registry.js';
import { skillRegistry } from '../../skills/infrastructure/registry.js';
import { readFile } from 'fs/promises';
import { initTelemetry } from '../telemetry/cli-tracer.js';

export const evalCommand = {
  description: 'Run agent/skill evaluations (run, compare, leaderboard)',
  async run({ subcommand, args, flags }) {
    const tracer = initTelemetry();
    const span = tracer.startSpan(`eval.${subcommand}`);

    try {
      switch (subcommand) {
        case 'run': {
          const [targetType, targetName, suitePath] = args;
          const content = await readFile(suitePath, 'utf8');
          const cases = content
            .trim()
            .split('\n')
            .filter((l) => l.trim())
            .map((l) => JSON.parse(l));

          const target =
            targetType === 'skill'
              ? await skillRegistry.load(targetName)
              : await agentRegistry.get(targetName);

          const harness = new EvalHarness({
            scorers: flags.scorers?.split(',') ?? ['json-schema', 'tool-call', 'llm-judge'],
            reporters: flags.reporters?.split(',') ?? ['console', 'json'],
          });

          return harness.runSuite({
            name: `${targetType}:${targetName}`,
            cases,
            target,
            targetType,
          });
        }

        case 'compare': {
          const { compare } = await import('../../eval/regression.js');
          return compare({ baselinePath: args[0], currentPath: args[1] });
        }

        case 'leaderboard': {
          const { Leaderboard } = await import('../../eval/leaderboard.js');
          const lb = new Leaderboard({ path: '.autoclaw/eval/leaderboard.json' });
          await lb.load();
          return lb.rankBy({ suite: flags.suite, limit: flags.limit ?? 10 });
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
