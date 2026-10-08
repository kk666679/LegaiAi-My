'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const mcp = require('../mcp');

function send(server, msg) { return server.handleMessage(msg); }

test('mcp: initialize returns capabilities + serverInfo', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
  assert.equal(r.result.serverInfo.name, 'autoclaw-mcp');
  assert.ok(r.result.capabilities.tools);
  assert.ok(r.result.capabilities.resources);
  assert.ok(r.result.capabilities.prompts);
});

test('mcp: notifications/initialized returns null and marks ready', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(r, null);
  assert.equal(s.state, 'ready');
});

test('mcp: tools/list returns 30+ tools', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.ok(r.result.tools.length >= 30, `expected >=30 tools, got ${r.result.tools.length}`);
  const names = r.result.tools.map(t => t.name);
  for (const required of ['agents_list', 'skills_list', 'kg_search', 'kdream_run', 'hitl_queue_list', 'consensus_vote', 'tasks', 'dataset_validate']) {
    if (required === 'tasks') {
      assert.ok(names.some(n => n.startsWith('task_')));
    } else {
      assert.ok(names.includes(required), `missing tool: ${required}`);
    }
  }
});

test('mcp: tools/call registry_snapshot returns valid JSON', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'registry_snapshot' } });
  assert.equal(r.result.isError, false);
  const parsed = JSON.parse(r.result.content[0].text);
  assert.ok(parsed.counts.agents >= 11);
});

test('mcp: tools/call unknown tool → TOOL_NOT_FOUND', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'nope_nope' } });
  assert.equal(r.error.code, -32003);
});

test('mcp: tools/call missing name → INVALID_PARAMS', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '2.0', id: 5, method: 'tools/call', params: {} });
  assert.equal(r.error.code, -32602);
});

test('mcp: resources/list returns autoclaw URIs', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '2.0', id: 6, method: 'resources/list' });
  const uris = r.result.resources.map(x => x.uri);
  assert.ok(uris.includes('autoclaw://health'));
  assert.ok(uris.includes('autoclaw://registry'));
  assert.ok(uris.some(u => u.startsWith('autoclaw://kg/node/')));
});

test('mcp: resources/read resolves health', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '2.0', id: 7, method: 'resources/read', params: { uri: 'autoclaw://health' } });
  const body = JSON.parse(r.result.contents[0].text);
  assert.equal(body.ok, true);
});

test('mcp: resources/read template resolves', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '2.0', id: 8, method: 'resources/read', params: { uri: 'autoclaw://skills/hermes' } });
  const body = JSON.parse(r.result.contents[0].text);
  assert.equal(body.name, 'hermes');
});

test('mcp: resources/read unknown → RESOURCE_NOT_FOUND', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '2.0', id: 9, method: 'resources/read', params: { uri: 'autoclaw://nope' } });
  assert.equal(r.error.code, -32002);
});

test('mcp: prompts/list returns 5 prompts', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '2.0', id: 10, method: 'prompts/list' });
  assert.equal(r.result.prompts.length, 5);
  const names = r.result.prompts.map(p => p.name);
  for (const n of ['irac_analysis', 'legal_memo', 'citation_check', 'bilingual_summary', 'agent_plan']) {
    assert.ok(names.includes(n), `missing prompt: ${n}`);
  }
});

test('mcp: prompts/get renders with args', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '2.0', id: 11, method: 'prompts/get', params: { name: 'irac_analysis', arguments: { query: 'unfair dismissal' } } });
  assert.equal(r.result.messages.length, 1);
  assert.ok(r.result.messages[0].content.text.includes('unfair dismissal'));
});

test('mcp: prompts/get unknown → PROMPT_NOT_FOUND', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '2.0', id: 12, method: 'prompts/get', params: { name: 'nope' } });
  assert.equal(r.error.code, -32004);
});

test('mcp: unknown method → METHOD_NOT_FOUND', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '2.0', id: 13, method: 'nope/method' });
  assert.equal(r.error.code, -32601);
});

test('mcp: invalid JSON-RPC version → INVALID_REQUEST', async () => {
  const s = mcp.createServer({});
  const r = await send(s, { jsonrpc: '1.0', id: 14, method: 'ping' });
  assert.equal(r.error.code, -32600);
});

test('mcp: logging/setLevel validates', async () => {
  const s = mcp.createServer({});
  const ok = await send(s, { jsonrpc: '2.0', id: 15, method: 'logging/setLevel', params: { level: 'warn' } });
  assert.deepEqual(ok.result, {});
  assert.equal(s.logLevel, 'warn');
  const bad = await send(s, { jsonrpc: '2.0', id: 16, method: 'logging/setLevel', params: { level: 'yelling' } });
  assert.equal(bad.error.code, -32602);
});

test('mcp: shutdown closes', async () => {
  const s = mcp.createServer({});
  await send(s, { jsonrpc: '2.0', id: 17, method: 'shutdown' });
  assert.equal(s.state, 'closed');
});

test('mcp: duplicate tool name throws', () => {
  const { ToolRegistry } = require('../mcp/tools');
  const tr = new ToolRegistry();
  tr.register({ name: 'x', handler: async () => ({}) });
  assert.throws(() => tr.register({ name: 'x', handler: async () => ({}) }), /Duplicate/);
  assert.throws(() => tr.register({ name: 'bad.name', handler: async () => ({}) }), /Invalid/);
});

test('mcp: full tool count >= 30', () => {
  const { buildDefaultTools } = require('../mcp/tools');
  const tr = buildDefaultTools({});
  assert.ok(tr.size() >= 30, `expected >=30 tools, got ${tr.size()}`);
});
