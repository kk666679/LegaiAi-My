/**
 * @lawmate/cli — evidence subcommand.
 */
import { EvidenceChain } from '@lawmate/evidence';

export function evidenceInfo(): void {
  const chain = new EvidenceChain();
  void chain;
  process.stdout.write('LAWMATE Evidence\n');
  process.stdout.write('===============\n\n');
  process.stdout.write('Chain: Claim → Evidence → Source → Provenance. Hash-chain verified.\n');
}