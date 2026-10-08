import { pickBanner } from '@lawmate/branding';
export function printBanner(): void {
  const banner = pickBanner('cli');
  if (banner) process.stdout.write(banner + '\n\n');
}
export function printHelp(): void {
  printBanner();
  process.stdout.write([
    'LAWMATE CLI', 'Developer Command Line', '',
    'Usage:', '  lawmate <command> [options]', '',
    'Commands:',
    '  login  logout  config  models  ai  research',
    '  documents  compliance  jobs  agents  mcp  usage', '',
    'Options:',
    '  --help, -h     Show this help',
    '  --version, -v  Show version',
    '  --no-banner    Suppress the LAWMATE banner',
    '  --json         Machine-readable output', '',
  ].join('\n'));
}
