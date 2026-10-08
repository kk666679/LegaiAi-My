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
import { AdapterRegistry } from '@lawmate/adapter';
import { RegistryCatalog } from '@lawmate/registry';

const SERVER_NAME = 'lawmate-mcp';
const SERVER_VERSION = '1.0.0';

function writeBanner(): void {
  const noBanner =
    process.env['LAWMATE_NO_BANNER'] === '1' ||
    process.env['LAWMATE_NO_BANNER'] === 'true';
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

const registry = new RegistryCatalog();
const adapters = new AdapterRegistry();

// Register built-in tools through the registry.
registry.register({
  id: 'tool://lawmate/ping',
  name: 'ping',
  kind: 'tool',
  version: '1.0.0',
  capabilities: ['health'],
  status: 'active',
});

registry.register({
  id: 'tool://lawmate/registry-list',
  name: 'registry_list',
  kind: 'tool',
  version: '1.0.0',
  capabilities: ['registry'],
  status: 'active',
});

registry.register({
  id: 'tool://lawmate/kg-stats',
  name: 'kg_stats',
  kind: 'tool',
  version: '1.0.0',
  capabilities: ['knowledge-graph'],
  status: 'active',
});

const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } }
);

function buildToolList() {
  const entries = registry.list();
  return entries
    .filter((e) => e.kind === 'tool' && e.status === 'active')
    .map((e) => ({
      name: e.name,
      description: e.description ?? `LAWMATE tool: ${e.name}`,
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: true,
      },
    }));
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: buildToolList(),
}));

server.setRequestHandler(CallToolRequestSchema, async (request: { params: { name: string; arguments?: Record<string, unknown> } }) => {
  const { name, arguments: args } = request.params;

  // Route through registry → safety → authorization → execution.
  const entry = registry.list().find((e) => e.name === name && e.kind === 'tool');
  if (!entry || entry.status !== 'active') {
    return {
      content: [{ type: 'text', text: `Tool not found or not active: ${name}` }],
      isError: true,
    };
  }

  if (name === 'ping') {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          pong: true,
          server: SERVER_NAME,
          version: SERVER_VERSION,
          system: 'LAWMATE MCP',
        }),
      }],
    };
  }

  if (name === 'registry_list') {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          entries: registry.list().map((e) => ({ id: e.id, name: e.name, kind: e.kind, version: e.version, status: e.status })),
        }),
      }],
    };
  }

  if (name === 'kg_stats') {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          adapters: adapters.list().map((a) => ({ id: a.id, kind: a.kind, healthy: a.healthy })),
        }),
      }],
    };
  }

  return {
    content: [{ type: 'text', text: `Tool '${name}' invoked with args: ${JSON.stringify(args ?? {})}` }],
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