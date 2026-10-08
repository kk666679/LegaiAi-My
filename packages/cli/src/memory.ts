/**
 * @lawmate/cli — memory subcommand.
 */
import { MemoryStore } from '@lawmate/memory';

export function memoryInfo(): void {
  const store = new MemoryStore();
  void store;
  process.stdout.write('LAWMATE Memory\n');
  process.stdout.write('============\n\n');
  process.stdout.write('Types: working, episodic, semantic, procedural, user-project, session\n');
  process.stdout.write('Supports TTL, retention policies, deletion, redaction, tenant isolation.\n');
}