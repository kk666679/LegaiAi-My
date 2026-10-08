import { GatewayServer } from '@lawmate/gateway';
import assert from 'node:assert';

const gw = new GatewayServer({ port: 0 });
const actualPort = await gw.start();

gw.getRegistry().register({
  id: 'tool://lawmate/test',
  name: 'test-tool',
  kind: 'tool',
  version: '1.0.0',
  capabilities: ['test'],
  status: 'active',
});

gw.getKg().addNode({ id: 'n1', type: 'case', label: 'Case 1' });
gw.getKg().addNode({ id: 'n2', type: 'case', label: 'Case 2' });
gw.getKg().addEdge({ from: 'n1', to: 'n2', relation: 'cites' });

gw.getEvidence().append('claim', { statement: 'Test claim' });

const base = 'http://127.0.0.1:' + actualPort;

async function get(path) {
  const res = await fetch(base + path);
  return { status: res.status, body: await res.json() };
}

const health = await get('/health');
assert.strictEqual(health.body.status, 'ok');
assert.ok(health.body.components.registry >= 1, 'registry count');
assert.strictEqual(health.body.components.kg.nodes, 2, 'kg nodes');
assert.ok(health.body.components.evidence >= 1, 'evidence count');

const registry = await get('/registry');
assert.ok(Array.isArray(registry.body.entries), 'registry entries');
assert.ok(registry.body.entries.length >= 1, 'registry has entries');

const queue = await get('/queue');
assert.ok(queue.body.stats, 'queue stats');

const memory = await get('/memory');
assert.strictEqual(typeof memory.body.size, 'number', 'memory size');

const kg = await get('/kg');
assert.strictEqual(kg.body.nodes, 2, 'kg endpoint nodes');

const evidence = await get('/evidence');
assert.ok(evidence.body.size >= 1, 'evidence endpoint');

await gw.stop();
console.log('PASS: gateway HTTP server');
