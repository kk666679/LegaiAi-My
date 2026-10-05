#!/usr/bin/env node
'use strict';

const mcp = require('../mcp');

const mode = process.argv[2] || 'stdio';

if (mode === 'stdio') {
  const { server, stop } = mcp.serveStdio({});
  process.on('SIGINT', () => { stop(); process.exit(0); });
} else if (mode === 'http') {
  const port = Number(process.argv[3]) || 7331;
  const { handler } = mcp.serveHttp({});
  const http = require('http');
  http.createServer(handler).listen(port, () => {
    process.stdout.write(`mcp http listening on :${port}\n`);
  });
} else if (mode === 'list') {
  const server = mcp.createServer({});
  const t = server.tools.list();
  const r = server.resources.list();
  const p = server.prompts.list();
  console.log(`tools: ${t.length}`);
  for (const x of t) console.log('  ' + x.name.padEnd(28) + (x.description || ''));
  console.log(`resources: ${r.length}`);
  for (const x of r) console.log('  ' + x.uri.padEnd(40) + (x.description || ''));
  console.log(`prompts: ${p.length}`);
  for (const x of p) console.log('  ' + x.name.padEnd(28) + (x.description || ''));
} else if (mode === 'call') {
  const name = process.argv[3];
  const json = process.argv[4] || '{}';
  if (!name) { console.error('usage: node bin/mcp.js call <tool> <json>'); process.exit(1); }
  const server = mcp.createServer({});
  server.handleMessage({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: JSON.parse(json) } })
    .then(resp => {
      if (resp.error) { console.error(JSON.stringify(resp.error, null, 2)); process.exit(1); }
      for (const c of resp.result.content || []) process.stdout.write((c.text || '') + '\n');
      if (resp.result.isError) process.exit(1);
    });
} else {
  console.log([
    'mcp — Autoclaw MCP server',
    '',
    'Usage:',
    '  node bin/mcp.js stdio',
    '  node bin/mcp.js http [port]',
    '  node bin/mcp.js list',
    '  node bin/mcp.js call <tool> <json>'
  ].join('\n'));
}
