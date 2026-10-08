/**
 * @lawmate/cli — help and banner.
 */
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
    '  agents         List registered agents',
    '  skills         List registered skills',
    '  tools          List registered tools',
    '  registry       Query the component registry',
    '  daemon         Daemon lifecycle (start|stop|restart|status|health|logs)',
    '  cloud          Cloud execution abstraction',
    '  vector         Vector storage and semantic retrieval',
    '  safety         Safety policy and authorization layer',
    '  kdream         KDREAM knowledge/reasoning representation',
    '  kg             Knowledge graph engine',
    '  memory         Agent memory infrastructure',
    '  learning       Learning and improvement loop',
    '  orchestrator   Workflow and agent orchestration',
    '  fabric         Unified execution fabric',
    '  evidence       Evidence and provenance system',
    '  eval           Evaluation framework',
    '  datasets       Dataset management and pipelines',
    '  comms          Communication infrastructure',
    '  adapter        Universal adapter/connector layer',
    '  autobuild      Automated build, validation, and packaging',
    '  gateway        AI API Gateway status',
    '  mcp            Model Context Protocol server', '',
    'Options:',
    '  --help, -h     Show this help',
    '  --version, -v  Show version',
    '  --no-banner    Suppress the LAWMATE banner',
    '  --json         Machine-readable output', '',
  ].join('\n'));
}