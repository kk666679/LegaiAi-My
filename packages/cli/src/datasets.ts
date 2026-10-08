/**
 * @lawmate/cli — datasets subcommand.
 */
import { DatasetRegistry } from '@lawmate/datasets';

export function datasetsInfo(): void {
  const registry = new DatasetRegistry();
  void registry;
  process.stdout.write('LAWMATE Datasets\n');
  process.stdout.write('===============\n\n');
  process.stdout.write('Splits: train, validation, test, evaluation, production-feedback.\n');
  process.stdout.write('Supports lineage, validation, deduplication, filtering, transformations, sampling, export/import.\n');
}