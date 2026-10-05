#!/usr/bin/env node
'use strict';
const { Dreamer, Policy } = require('../kgdream');

/**
 * In-memory mock store seeded from dataset/seed/*.
 *
 * Replace `mockStore()` with the real kg/ SQLite adapter to run the cycle
 * against durable state. The store contract the phases require is documented
 * in kgdream/README.md.
 */
function mockStore() {
  const ds = require('../dataset');
  const seed = ds.loadAll().seed;
  const nodes = new Map((seed['kg-nodes'] || []).map(n => [n.id, { ...n }]));
  const edges = new Map((seed['kg-edges'] || []).map(e => [e.id, { ...e }]));
  return {
    async listNodes({ limit = 200 } = {}) { return [...nodes.values()].slice(0, limit); },
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
    async removeEdge(id) { edges.delete(id); return true; },
    _nodes: nodes,
    _edges: edges
  };
}

(async () => {
  const mode = process.argv[2] || 'light';
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) console.error('[kgdream] dry-run: no state will be mutated');
  const store = mockStore();
  const dreamer = new Dreamer({ store, policy: new Policy({ dryRun }) });
  const report = await dreamer.runCycle({ mode, reason: 'cli' });
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
})();
