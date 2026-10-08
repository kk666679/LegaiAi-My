/**
 * @lawmate/cli — kg subcommand.
 */
import { KnowledgeGraph } from '@lawmate/kg';

export function kgInfo(): void {
  const kg = new KnowledgeGraph();
  void kg;
  process.stdout.write('LAWMATE Knowledge Graph\n');
  process.stdout.write('======================\n\n');
  process.stdout.write('Interfaces: KnowledgeGraph, GraphStore, EntityResolver, OntologyRegistry\n');
}