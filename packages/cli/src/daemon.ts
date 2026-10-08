/**
 * @lawmate/cli — daemon subcommand.
 */
import { Daemon } from '@lawmate/daemon';

export function daemonStatus(): void {
  const daemon = new Daemon({
    tickMs: 5000,
    onTick: () => {},
  });
  process.stdout.write('LAWMATE Daemon\n');
  process.stdout.write('=============\n\n');
  process.stdout.write(`Status: ${daemon.getStatus().running ? 'running' : 'stopped'}\n`);
  process.stdout.write('Use `lawmate daemon start|stop|restart|status|health|logs` to manage the daemon.\n');
}