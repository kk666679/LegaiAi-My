import { pickBanner } from '@lawmate/branding';
import { printBanner, printHelp } from './help.js';

export const VERSION = '1.0.0';

export function main(argv: string[]): number {
  const args = argv.slice(2);

  if (args.includes('--no-banner')) process.env.LAWMATE_NO_BANNER = '1';

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return 0;
  }

  if (args.includes('--version') || args.includes('-v')) {
    process.stdout.write(`LAWMATE CLI v${VERSION}\n`);
    return 0;
  }

  const command = args[0] ?? '';
  const json = args.includes('--json');

  if (!json) printBanner();

  const known = [
    'login', 'logout', 'config', 'models', 'ai', 'research',
    'documents', 'compliance', 'jobs', 'agents', 'mcp', 'usage',
  ];

  if (!known.includes(command)) {
    process.stderr.write(`LAWMATE CLI Error: unknown command '${command}'\n`);
    return 1;
  }

  if (json) {
    process.stdout.write(JSON.stringify({ command, status: 'not-implemented' }) + '\n');
  } else {
    process.stdout.write(`[LAWMATE CLI] '${command}' is not yet implemented.\n`);
  }
  return 0;
}
