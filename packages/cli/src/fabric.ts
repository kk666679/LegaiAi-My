/**
 * @lawmate/cli — fabric subcommand.
 */
import { Fabric } from '@lawmate/fabric';

export function fabricInfo(): void {
  const fabric = new Fabric();
  void fabric;
  process.stdout.write('LAWMATE Fabric\n');
  process.stdout.write('============\n\n');
  process.stdout.write('Unified execution fabric: event bus, message envelopes, execution context, correlation IDs, distributed tracing.\n');
}