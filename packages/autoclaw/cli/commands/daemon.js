import { AutoClawDaemon } from '../../daemon/index.js';
import { initTelemetry } from '../telemetry/cli-tracer.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const daemonCommand = {
  description: 'Daemon management (start, stop, status, logs, reload)',
  async run({ subcommand, args, flags }) {
    const tracer = initTelemetry();
    const span = tracer.startSpan(`daemon.${subcommand}`);

    try {
      const daemon = new AutoClawDaemon({ config: {} });

      switch (subcommand) {
        case 'start': {
          const result = await daemon.start();
          return { status: 'started', ...result };
        }

        case 'stop': {
          const result = await daemon.stop({ timeoutMs: flags.timeout ?? 30000 });
          return { status: 'stopped', ...result };
        }

        case 'status': {
          return await daemon.health();
        }

        case 'logs': {
          const lines = parseInt(flags.tail ?? flags.lines ?? 100, 10);
          const logPath = '.autoclaw/control/logs/autoclawd.log';
          try {
            const content = await readFile(logPath, 'utf8');
            const logLines = content.trim().split('\n');
            return {
              lines: logLines.slice(-lines),
              total: logLines.length,
            };
          } catch {
            return { error: 'No log file found', logPath };
          }
        }

        case 'reload': {
          const result = await daemon.reload();
          return { status: 'reloaded', ...result };
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
