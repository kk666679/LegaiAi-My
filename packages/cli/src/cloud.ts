/**
 * @lawmate/cli — cloud subcommand.
 */
export function cloudInfo(): void {
  process.stdout.write('LAWMATE Cloud\n');
  process.stdout.write('============\n\n');
  process.stdout.write('Provider-neutral cloud execution abstraction.\n');
  process.stdout.write('Providers: CloudProvider, StorageProvider, ComputeProvider, QueueProvider, SecretsProvider\n');
}