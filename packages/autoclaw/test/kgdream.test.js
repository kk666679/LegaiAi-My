'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Dreamer, Policy, PHASES } = require('../kgdream');

/** Minimal in-memory store implementing the documented store contract. */
function mockStore() {
  const nodes = new Map();
  const edges = new Map();
  return {
    nodes, edges,
    async listNodes({ limit = 100 } = {}) { return [...nodes.values()].slice(0, limit); },
    async getNode(id) { return nodes.get(id) || null; },
    async upsert(n) { nodes.set(n.id, n); return n; },
    async removeNode(id) { nodes.delete(id); return true; },
    async neighbours(id, { limit = 20 } = {}) {
      const out = [];
      for (const e of edges.values()) {
        if (e.from === id) out.push({ id: e.to, rel: e.rel, weight: e.weight, edgeId: e.id });
        else if (e.to === id) out.push({ id: e.from, rel: e.rel, weight: e.weight, edgeId: e.id });
        if (out.length >= limit) break;
      }
      return out;
    },
    async putEdge(e) { edges.set(e.id, e); return e; },
    async removeEdge(id) { edges.delete(id); return true; }
  };
}

function seed(store) {
  const now = Date.now();
  store.nodes.set('n1', { id: 'n1', title: 'Unfair Dismissal', canonical: 'unfair dismissal', salience: 0.9, lastSeen: now - 1000 });
  store.nodes.set('n2', { id: 'n2', title: 'Unfair Dismissal', canonical: 'unfair dismissal', salience: 0.8, lastSeen: now - 2000 });
  store.nodes.set('n3', { id: 'n3', title: 'Case Three', salience: 0.7, lastSeen: now - 3000 });
  store.nodes.set('n4', { id: 'n4', title: 'Case Four', salience: 0.6, lastSeen: now - 4000 });
  store.edges.set('e1', { id: 'e1', from: 'n1', to: 'n3', rel: 'cites', weight: 0.9 });
  store.edges.set('e2', { id: 'e2', from: 'n2', to: 'n4', rel: 'cites', weight: 0.8 });
  store.edges.set('e3', { id: 'e3', from: 'n3', to: 'n4', rel: 'related', weight: 0.10 });
}

test('kgdream: dry-run does not mutate state', async () => {
  const store = mockStore(); seed(store);
  const dreamer = new Dreamer({ store, policy: new Policy({ dryRun: true }) });
  const r = await dreamer.runCycle({ mode: 'deep' });
  assert.equal(r.dryRun, true);
  assert.equal(store.nodes.size, 4);
  assert.equal(store.edges.size, 3);
});

test('kgdream: deep cycle merges duplicates and prunes weak edges', async () => {
  const store = mockStore(); seed(store);
  const dreamer = new Dreamer({ store });
  const r = await dreamer.runCycle({ mode: 'deep' });
  assert.equal(r.ok, true);
  const cons = r.phases.find(p => p.name === 'consolidate');
  assert.ok(cons.merges.length >= 1, 'expected at least one merge');
  assert.equal(store.nodes.size, 3, 'duplicate removed');
  const pr = r.phases.find(p => p.name === 'prune');
  assert.ok(pr.pruned.includes('e3'), 'weak edge e3 pruned');
  assert.ok(!store.edges.has('e3'));
});

test('kgdream: light mode runs only replay + prune', async () => {
  const store = mockStore(); seed(store);
  const r = await new Dreamer({ store }).runCycle({ mode: 'light' });
  assert.deepEqual(r.phases.map(p => p.name), ['replay', 'prune']);
});

test('kgdream: busy guard throws when running', async () => {
  const store = mockStore(); seed(store);
  const d = new Dreamer({ store });
  const p = d.runCycle({ mode: 'deep' });
  await assert.rejects(() => d.runCycle({ mode: 'deep' }), /already running/);
  await p;
});

test('kgdream: PHASES exports all five phases', () => {
  for (const k of ['replay', 'consolidate', 'prune', 'enrich', 'reflect']) {
    assert.equal(typeof PHASES[k], 'function', `PHASES.${k}`);
  }
});