/**
 * @lawmate/cli — mcp subcommand.
 */
export function mcpInfo(): void {
  process.stdout.write('LAWMATE MCP\n');
  process.stdout.write('==========\n\n');
  process.stdout.write('Model Context Protocol server.\n');
  process.stdout.write('Exposes only explicitly registered tools/resources/prompts.\n');
  process.stdout.write('Tool calls must pass: Registry → Safety → Authorization → Tool execution.\n');
}