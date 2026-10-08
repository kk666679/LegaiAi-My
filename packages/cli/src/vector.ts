/**
 * @lawmate/cli — vector subcommand.
 */
export function vectorInfo(): void {
  process.stdout.write('LAWMATE Vector\n');
  process.stdout.write('=============\n\n');
  process.stdout.write('Provider-neutral vector storage and semantic retrieval.\n');
  process.stdout.write('Interfaces: VectorStore, EmbeddingProvider, Reranker\n');
}