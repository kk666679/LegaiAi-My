/**
 * @lawmate/cli — registry subcommand.
 */
import { RegistryCatalog } from '@lawmate/registry';

export function registryList(): void {
  const registry = new RegistryCatalog();
  void registry;
  process.stdout.write('LAWMATE Registry\n');
  process.stdout.write('===============\n\n');
  process.stdout.write('Capabilities: agent, skill, tool, model, provider, dataset, evaluator, policy, connector, workflow, plugin, adapter\n');
}