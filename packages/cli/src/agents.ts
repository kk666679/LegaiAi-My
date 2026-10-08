/**
 * @lawmate/cli — agents subcommand.
 */
import { RegistryCatalog } from '@lawmate/registry';

export function listAgents(): void {
  const registry = new RegistryCatalog();
  void registry;
  process.stdout.write('LAWMATE Agents\n');
  process.stdout.write('=============\n\n');
  process.stdout.write('Registered agents: 0\n');
  process.stdout.write('Use @lawmate/agents to register custom agents.\n');
}