#!/usr/bin/env node
/**
 * @lawmate/mcp — LAWMATE MCP server.
 *
 * Model Context Protocol server for the LAWMATE platform.
 *
 * IMPORTANT: stdout is reserved for the MCP JSON-RPC protocol.
 * All human-readable output (banner, logs, errors) MUST go to stderr.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const SERVER_NAME = 'lawmate-mcp';
const SERVER_VERSION = '1.0.0';

/**
 * Write the LAWMATE banner to stderr.
 * Never writes to stdout — that channel belongs to the MCP protocol.
 */
function writeBanner(): void {
  const noBanner =
    process.env.LAWMATE_NO_BANNER === '1' ||
    process.env.LAWMATE_NO_BANNER === 'true';
  if (noBanner) return;

  const banner = `
██╗      █████╗ ██╗    ██╗███╗   ███╗ █████╗ ████████╗███████╗
██║     ██╔══██╗██║    ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
██║     ███████║██║ █╗ ██║██╔████╔██║███████║   ██║   █████╗
██║     ██╔══██║██║███╗██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝
███████╗██║  ██║╚███╔███╔╝██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝

                 MCP • CLI • AI API GATEWAY

LAWMATE MCP
Model Context Protocol

Server: ready
Transport: stdio
Version: ${SERVER_VERSION}
`;
  process.stderr.write(banner);
}

const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'ping',
      description: 'Health check — returns pong and the server version.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;

  if (name === 'ping') {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            pong: true,
            server: SERVER_NAME,
            version: SERVER_VERSION,
            system: 'LAWMATE MCP',
          }),
        },
      ],
    };
  }

  return {
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

async function main(): Promise<void> {
  writeBanner();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`[LAWMATE MCP] fatal: ${(err as Error).message}\n`);
  process.exit(1);
});
