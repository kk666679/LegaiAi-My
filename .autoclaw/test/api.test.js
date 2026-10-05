'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { createServer, resolveDeps } = require('../api');

let server, base;

test.before(async () => {
const deps = resolveDeps();
server = createServer(deps);
await new Promise(res => server.listen(0, res));
base = http://127.0.0.1:${server.address().port};
});

test.after(() => new Promise(res => server.close(res)));

function req(method, path, body) {
return new Promise((resolve, reject) => {
const u = new URL(path, base);
const payload = body !== undefined ? JSON.stringify(body) : null;
const headers = payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {};
const r = http.request({ method, hostname: u.hostname, port: u.port, path: u.pathname + u.search, headers }, res => {
let buf = '';
res.on('data', c => buf += c);
res.on('end', () => {
let json = null;
try { json = JSON.parse(buf); } catch (_) {}
resolve({ status: res.statusCode, headers: res.headers, text: buf, json });
});
});
r.on('error', reject);
if (payload) r.write(payload);
r.end();
});
}

/* ── system ── */
test('api: GET /api/health', async () => {
const r = await req('GET', '/api/health');
assert.equal(r.status, 200);
assert.equal(r.json.ok, true);
assert.ok(r.headers['x-request-id']);
});

test('api: GET /api/readyz reports checks', async () => {
const r = await req('GET', '/api/readyz');
assert.equal(r.status, 200);
assert.equal(r.json.ok, true);
assert.ok(r.json.checks.registry);
});

test('api: GET /api/metrics returns text/plain', async () => {
const r = await req('GET', '/api/metrics');
assert.equal(r.status, 200);
assert.match(r.headers['content-type'], /text/plain/);
});

test('api: GET /api/metrics/snapshot returns JSON', async () => {
const r = await req('GET', '/api/metrics/snapshot');
assert.equal(r.status, 200);
assert.ok(r.json.counters !== undefined);
});

test('api: POST /api/mcp passthrough', async () => {
const r = await req('POST', '/api/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/list' });
assert.equal(r.status, 200);
assert.ok(r.json.result.tools.length >= 30);
});

/* ── catalog ── */
test('api: GET /api/registry', async () => {
const r = await req('GET', '/api/registry');
assert.equal(r.status, 200);
assert.ok(r.json.counts.agents >= 11);
});

test('api: GET /api/registry/integrity', async () => {
const r = await req('GET', '/api/registry/integrity');
assert.equal(r.status, 200);
assert.equal(r.json.ok, true);
});

test('api: GET /api/agents', async () => {
const r = await req('GET', '/api/agents');
assert.equal(r.status, 200);
assert.equal(r.json.agents.length, 11);
});

test('api: GET /api/agents/:id', async () => {
const r = await req('GET', '/api/agents/issue-spotter');
assert.equal(r.status, 200);
assert.equal(r.json.meta.id, 'issue-spotter');
});

test('api: GET /api/agents/:id → 404 for unknown', async () => {
const r = await req('GET', '/api/agents/nope');
assert.equal(r.status, 404);
assert.equal(r.json.error.code, 'UNKNOWN_AGENT');
});

test('api: POST /api/agents/:id/invoke', async () => {
const r = await req('POST', '/api/agents/issue-spotter/invoke', { query: 'Is this unfair dismissal?' });
assert.equal(r.status, 200);
assert.ok(r.json.agent === 'issue-spotter');
assert.ok(Array.isArray(r.json.steps));
});

test('api: POST /api/agents/route', async () => {
const r = await req('POST', '/api/agents/route', { input: { q: 'x' } });
assert.equal(r.status, 200);
assert.equal(r.json.primary, 'retriever');
});

test('api: GET /api/skills', async () => {
const r = await req('GET', '/api/skills');
assert.equal(r.status, 200);
assert.ok(r.json.count >= 11);
});

test('api: GET /api/skills/:name', async () => {
const r = await req('GET', '/api/skills/hermes');
assert.equal(r.status, 200);
assert.equal(r.json.name, 'hermes');
assert.ok(r.json.goldenCount >= 3);
});

test('api: GET /api/skills/:name/golden', async () => {
const r = await req('GET', '/api/skills/architect/golden');
assert.equal(r.status, 200);
assert.ok(Array.isArray(r.json));
assert.ok(r.json.length >= 3);
});

test('api: GET /api/skills/:name/reference as markdown', async () => {
const r = await req('GET', '/api/skills/hermes/reference');
assert.equal(r.status, 200);
assert.match(r.headers['content-type'], /text/markdown/);
assert.ok(r.text.includes('# Hermes'));
});

test('api: GET /api/skills/validate', async () => {
const r = await req('GET', '/api/skills/validate');
assert.equal(r.status, 200);
assert.equal(r.json.ok, true);
});

test('api: GET /api/dataset', async () => {
const r = await req('GET', '/api/dataset');
assert.equal(r.status, 200);
assert.ok(r.json.seed);
});

/* ── knowledge ── */
test('api: GET /api/kg/stats', async () => {
const r = await req('GET', '/api/kg/stats');
assert.equal(r.status, 200);
assert.ok(typeof r.json.nodes === 'number');
});

test('api: POST /api/kg/upsert + GET node roundtrip', async () => {
const id = 'test:api-node-' + Date.now();
const up = await req('POST', '/api/kg/upsert', { node: { id, type: 'concept', title: 'API Test Node', canonical: 'api test node' } });
assert.equal(up.status, 200);
const got = await req('GET', /api/kg/node/${id});
assert.equal(got.status, 200);
assert.equal(got.json.id, id);
});

test('api: GET /api/kg/search without q → 400', async () => {
const r = await req('GET', '/api/kg/search');
assert.equal(r.status, 400);
assert.equal(r.json.error.code, 'MISSING_QUERY');
});

test('api: POST /api/kdream/run (dry-run)', async () => {
const r = await req('POST', '/api/kdream/run', { mode: 'light', dryRun: true });
assert.equal(r.status, 200);
assert.equal(r.json.dryRun, true);
assert.ok(Array.isArray(r.json.phases));
});

/* ── interaction ── */
test('api: GET /api/hitl/queue', async () => {
const r = await req('GET', '/api/hitl/queue');
assert.equal(r.status, 200);
assert.ok(Array.isArray(r.json));
});

test('api: POST /api/hitl/evaluate', async () => {
const r = await req('POST', '/api/hitl/evaluate', { proposal: 'x', confidence: 0.95 });
assert.equal(r.status, 200);
assert.equal(r.json.escalate, false);
});

test('api: POST /api/consensus/vote with inline voters', async () => {
const r = await req('POST', '/api/consensus/vote', {
proposal: 'test',
voters: [
{ id: 'a', vote: 'yes', confidence: 0.9 },
{ id: 'b', vote: 'yes', confidence: 0.8 }
]
});
assert.equal(r.status, 200);
assert.equal(r.json.outcome, 'accepted');
});

test('api: GET /api/consensus/strategies', async () => {
const r = await req('GET', '/api/consensus/strategies');
assert.equal(r.status, 200);
assert.ok(r.json.strategies.includes('threshold'));
});

test('api: POST /api/tasks', async () => {
const r = await req('POST', '/api/tasks', { kind: 'eval.run', payload: { cases: [] } });
assert.equal(r.status, 202);
assert.equal(r.json.kind, 'eval.run');
});

/* ── output ── */
test('api: POST /api/export/irac returns markdown', async () => {
const r = await req('POST', '/api/export/irac', { result: { issue: 'I', rule: 'R', application: 'A', conclusion: 'C' } });
assert.equal(r.status, 200);
assert.match(r.headers['content-type'], /text/markdown/);
assert.ok(r.text.includes('# IRAC Analysis'));
});

test('api: POST /api/export/html', async () => {
const r = await req('POST', '/api/export/html', { result: { issue: 'I', rule: 'R', application: 'A', conclusion: 'C' } });
assert.equal(r.status, 200);
assert.match(r.headers['content-type'], /text/html/);
assert.ok(r.text.includes('<article'));
});

test('api: POST /api/export/render-all', async () => {
const r = await req('POST', '/api/export/render-all', { result: { issue: 'I', conclusion: 'C' } });
assert.equal(r.status, 200);
assert.ok(r.json.rendered.irac);
});

test('api: POST /api/i18n/detect', async () => {
const r = await req('POST', '/api/i18n/detect', { text: 'Mahkamah telah memutuskan bahawa' });
assert.equal(r.status, 200);
assert.equal(r.json.lang, 'ms');
});

test('api: POST /api/i18n/translate', async () => {
const r = await req('POST', '/api/i18n/translate', { key: 'conclusion.heading', lang: 'ms' });
assert.equal(r.status, 200);
assert.equal(r.json.text, 'Kesimpulan');
});

test('api: GET /api/cache/stats', async () => {
const r = await req('GET', '/api/cache/stats');
assert.equal(r.status, 200);
assert.ok(r.json.responses);
});

/* ── errors ── */
test('api: unknown route → 404', async () => {
const r = await req('GET', '/api/nope');
assert.equal(r.status, 404);
assert.equal(r.json.error.code, 'NOT_FOUND');
});

test('api: POST with invalid JSON → 400', async () => {
const r = await new Promise((resolve, reject) => {
const u = new URL('/api/kg/upsert', base);
const payload = '{not json';
const rq = http.request({ method: 'POST', hostname: u.hostname, port: u.port, path: u.pathname, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, res => {
let buf = ''; res.on('data', c => buf += c);
res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(buf) }));
});
rq.on('error', reject);
rq.write(payload);
rq.end();
});
assert.equal(r.status, 400);
assert.match(r.json.error.message, /invalid JSON/);
});

test('api: OPTIONS preflight → 204 with CORS', async () => {
const r = await req('OPTIONS', '/api/health');
assert.equal(r.status, 204);
assert.equal(r.headers['access-control-allow-origin'], '*');
});
