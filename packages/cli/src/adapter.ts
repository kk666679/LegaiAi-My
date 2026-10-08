/**
 * @lawmate/cli — adapter subcommand.
 */
export function adapterInfo(): void {
  process.stdout.write('LAWMATE Adapter\n');
  process.stdout.write('==============\n\n');
  process.stdout.write('Universal connector layer. Adapters: LLM, embeddings, vector, databases, graph, memory, object storage, cloud, search, message brokers, auth, MCP, external APIs, filesystem, datasets.\n');
  process.stdout.write('Lifecycle: discover → register → validate → initialize → health → execute → pause → disable → shutdown → remove.\n');
}