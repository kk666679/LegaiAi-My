/**
 * @lawmate/cli — main entry point.
 */
import { printBanner, printHelp } from './help.js';
import { listAgents } from './agents.js';
import { listSkills } from './skills.js';
import { listTools } from './tools.js';
import { registryList } from './registry.js';
import { daemonStatus } from './daemon.js';
import { cloudInfo } from './cloud.js';
import { vectorInfo } from './vector.js';
import { safetyInfo } from './safety.js';
import { kdreamInfo } from './kdream.js';
import { kgInfo } from './kg.js';
import { memoryInfo } from './memory.js';
import { evidenceInfo } from './evidence.js';
import { evalInfo } from './eval.js';
import { datasetsInfo } from './datasets.js';
import { learningInfo } from './learning.js';
import { orchestratorInfo } from './orchestrator.js';
import { fabricInfo } from './fabric.js';
import { commsInfo } from './comms.js';
import { adapterInfo } from './adapter.js';
import { autobuildInfo } from './autobuild.js';
import { gatewayInfo } from './gateway.js';
import { mcpInfo } from './mcp.js';

export const VERSION = '1.0.0';

export function main(argv: string[]): number {
  const args = argv.slice(2);

  if (args.includes('--no-banner')) process.env['LAWMATE_NO_BANNER'] = '1';
  const json = args.includes('--json');
  const command = args[0] ?? '';

  const handlers: Record<string, () => void> = {
    agents: listAgents,
    skills: listSkills,
    tools: listTools,
    registry: registryList,
    daemon: daemonStatus,
    cloud: cloudInfo,
    vector: vectorInfo,
    safety: safetyInfo,
    kdream: kdreamInfo,
    kg: kgInfo,
    memory: memoryInfo,
    learning: learningInfo,
    orchestrator: orchestratorInfo,
    fabric: fabricInfo,
    evidence: evidenceInfo,
    eval: evalInfo,
    datasets: datasetsInfo,
    comms: commsInfo,
    adapter: adapterInfo,
    autobuild: autobuildInfo,
    gateway: gatewayInfo,
    mcp: mcpInfo,
  };

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return 0;
  }

  if (args.includes('--version') || args.includes('-v')) {
    process.stdout.write(`LAWMATE CLI v${VERSION}\n`);
    return 0;
  }

  if (!json) printBanner();

  const handler = handlers[command];
  if (!handler) {
    process.stderr.write(`LAWMATE CLI Error: unknown command '${command}'\n`);
    process.stderr.write('Run `lawmate --help` for available commands.\n');
    return 1;
  }

  if (json) {
    process.stdout.write(JSON.stringify({ command, status: 'ok' }) + '\n');
  } else {
    handler();
  }
  return 0;
}