'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const kg = require('../kg');

function memoryKG(opts = {}) { return kg.createKG({ memory: true, ...opts }); }

function hasSqlite() {
  try { execFileSync('sqlite3', ['-version'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

/** A throwaway kg.db built from the real schema.sql. */
function tempSqliteKG() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'autoclaw-kg-'));
  const dbPath = path.join(dir, 'kg.db');
  execFileSync('sqlite3', [dbPath], { input: fs.readFileSync(path.join(__dirname, '..', 'kg', 'schema.sql'), 'utf8') });
  return kg.createKG({ dbPath });
}

test('kg: createKG in-memory exposes store / query / ingest', () => {
  const g = memoryKG();
  assert.equal(g.backend, 'memory');
  assert.ok(g.store && g.query && g.ingest);
});

test('kg: upsert + getNode roundtrip preserves tags and salience', async () => {
  const g = memoryKG();
  await g.upsert({ id: 'n1', type: 'case', title: 'Case A', salience: 0.9, tags: ['x'] });
  const n = await g.getNode('n1');
  assert.equal(n.id, 'n1');
  assert.equal(n.salience, 0.9);
  assert.deepEqual(n.tags, ['x']);
});

test('kg: upsert merges rather than replaces', async () => {
  const g = memoryKG();
  await g.upsert({ id: 'n1', type: 'case', title: 'Case A', salience: 0.9, tags: ['x'] });
  const createdAt = (await g.getNode('n1')).createdAt;
  await g.upsert({ id: 'n1', title: 'Case A (updated)' });
  const n = await g.getNode('n1');
  assert.equal(n.title, 'Case A (updated)');
  assert.equal(n.salience, 0.9, 'unspecified fields survive an upsert');
  assert.deepEqual(n.tags, ['x']);
  assert.equal(n.createdAt, createdAt);
});

test('kg: upsert without an id is rejected', async () => {
  const g = memoryKG();
  await assert.rejects(() => g.upsert({ type: 'case', title: 'no id' }), /requires \{ id \}/);
});

test('kg: neighbours resolves both directions of an edge', async () => {
  const g = memoryKG();
  await g.upsert({ id: 'a', type: 'case', title: 'A' });
  await g.upsert({ id: 'b', type: 'case', title: 'B' });
  await g.putEdge({ id: 'e1', from: 'a', to: 'b', rel: 'cites', weight: 0.8 });
  const fromA = await g.store.neighbours('a');
  const fromB = await g.store.neighbours('b');
  assert.equal(fromA.length, 1);
  assert.equal(fromA[0].id, 'b');
  assert.equal(fromA[0].rel, 'cites');
  assert.equal(fromB[0].id, 'a');
});

test('kg: neighbours honours the rel filter', async () => {
  const g = memoryKG();
  await g.upsert({ id: 'a', type: 'case', title: 'A' });
  await g.upsert({ id: 'b', type: 'case', title: 'B' });
  await g.upsert({ id: 'c', type: 'case', title: 'C' });
  await g.putEdge({ id: 'e1', from: 'a', to: 'b', rel: 'cites', weight: 0.8 });
  await g.putEdge({ id: 'e2', from: 'a', to: 'c', rel: 'overruled', weight: 0.8 });
  assert.equal((await g.store.neighbours('a', { rel: 'cites' })).length, 1);
});

test('kg: search ranks a canonical exact match first', async () => {
  const g = memoryKG();
  await g.upsert({ id: 'a', type: 'case', title: 'Unfair Dismissal', canonical: 'unfair dismissal' });
  await g.upsert({ id: 'b', type: 'case', title: 'Something Else', canonical: 'something else' });
  const hits = await g.search({ q: 'unfair dismissal', k: 5 });
  assert.ok(hits.length >= 1);
  assert.equal(hits[0].id, 'a');
});

test('kg: search returns nothing for a non-matching query', async () => {
  const g = memoryKG();
  await g.upsert({ id: 'a', type: 'case', title: 'Unfair Dismissal' });
  assert.deepEqual(await g.search({ q: 'xyzzynotathing' }), []);
});

test('kg: search requires a query', async () => {
  await assert.rejects(() => memoryKG().search({}), /requires \{ q \}/);
});

test('kg: traverse honours hops and rels', async () => {
  const g = memoryKG();
  for (const id of ['a', 'b', 'c', 'd']) await g.upsert({ id, type: 'concept', title: id });
  await g.putEdge({ id: 'e1', from: 'a', to: 'b', rel: 'x', weight: 0.9 });
  await g.putEdge({ id: 'e2', from: 'b', to: 'c', rel: 'y', weight: 0.9 });
  await g.putEdge({ id: 'e3', from: 'c', to: 'd', rel: 'x', weight: 0.9 });
  const t = await g.traverse({ start: 'a', hops: 2, rels: ['x'] });
  assert.ok(t.nodes.includes('a') && t.nodes.includes('b'));
  assert.ok(!t.nodes.includes('c'), 'rel y must be filtered out');
  assert.ok(t.edges.every(e => e.rel === 'x'));
});

test('kg: hybrid falls back to search with no dense or sparse backend', async () => {
  const g = memoryKG();
  await g.upsert({ id: 'a', type: 'case', title: 'Unfair Dismissal', canonical: 'unfair dismissal' });
  const { hits } = await g.hybrid({ q: 'unfair dismissal', k: 3 });
  assert.equal(hits[0].id, 'a');
});

test('kg: hybrid fuses dense and sparse hits', async () => {
  const g = memoryKG({
    dense: { search: async () => [{ id: 'd1', title: 'dense hit' }] },
    sparse: { search: async () => [{ id: 'd1', title: 'dense hit' }, { id: 's1', title: 'sparse hit' }] }
  });
  const { hits } = await g.hybrid({ q: 'anything', k: 5 });
  assert.deepEqual(hits.map(h => h.id), ['d1', 's1'], 'agreement between backends ranks first');
});

test('kg: ingest validates and routes failures to the DLQ', async () => {
  const g = memoryKG();
  const r = await g.ingest.batch([
    { id: 'ok1', type: 'case', title: 'Good' },
    { id: 'bad1' },
    { id: 'e1', from: 'ok1', to: 'ok1', rel: 'self' }
  ]);
  assert.equal(r.total, 3);
  assert.equal(r.ok, 2);
  assert.equal(r.failed, 1);
  assert.equal(r.dlqSize, 1);
  const dlq = g.ingest.drainDlq();
  assert.equal(dlq.length, 1);
  assert.equal(dlq[0].item.id, 'bad1');
  assert.match(dlq[0].reason, /missing-type/);
  assert.equal(g.ingest.dlq.length, 0, 'drain empties the queue');
});

test('kg: ingest.link derives one id for both call orders', async () => {
  const g = memoryKG();
  await g.upsert({ id: 'a', type: 'case', title: 'A' });
  await g.upsert({ id: 'b', type: 'case', title: 'B' });
  const r1 = await g.ingest.link('a', 'b', 'cites');
  const r2 = await g.ingest.link('b', 'a', 'cites');
  assert.equal(r1.id, r2.id);
  assert.equal(g.stats().edges, 1, 'link is idempotent, not additive');
});

test('kg: canonical helpers are pure and stable', () => {
  assert.equal(kg.canonicalKey({ title: 'Unfair   Dismissal!' }), 'unfair dismissal');
  assert.equal(kg.edgeKey('b', 'a', 'x'), kg.edgeKey('a', 'b', 'x'));
  assert.notEqual(kg.edgeKey('a', 'b', 'x'), kg.edgeKey('a', 'b', 'y'));
  assert.equal(kg.stableHash('anything'), kg.stableHash('anything'));
  assert.equal(kg.slugify('Unfair Dismissal!'), 'unfair-dismissal');
});

test('kg: stats reports counts and a type breakdown', async () => {
  const g = memoryKG();
  await g.upsert({ id: 'n1', type: 'case', title: 'A' });
  await g.upsert({ id: 'n2', type: 'statute', title: 'B' });
  await g.putEdge({ id: 'e1', from: 'n1', to: 'n2', rel: 'cites', weight: 1 });
  const s = g.stats();
  assert.equal(s.nodes, 2);
  assert.equal(s.edges, 1);
  assert.equal(s.byType.case, 1);
  assert.equal(s.byType.statute, 1);
});

test('kg: openStore falls back to memory when the db is missing', () => {
  const { openStore, MemoryStore } = require('../kg/store');
  assert.ok(openStore({ dbPath: '/nonexistent/xyz.db' }) instanceof MemoryStore);
  assert.ok(openStore({ memory: true }) instanceof MemoryStore);
});

test('kg: SQLiteStore refuses a missing db loudly', () => {
  const { SQLiteStore } = require('../kg/store');
  assert.throws(() => new SQLiteStore({ dbPath: '/nonexistent/xyz.db' }), /db not found/);
});

test('kg: store satisfies the contract kgdream consumes', async () => {
  const g = memoryKG();
  for (const m of ['listNodes', 'getNode', 'upsert', 'removeNode', 'listEdges', 'getEdge',
    'neighbours', 'putEdge', 'removeEdge', 'search', 'stats']) {
    assert.equal(typeof g.store[m], 'function', `store.${m} is required by kgdream phases`);
  }
});

test('kg: sqlite backend roundtrips a node, an edge and a search', { skip: !hasSqlite() }, async () => {
  const g = tempSqliteKG();
  assert.equal(g.backend, 'sqlite');
  await g.upsert({ id: 's1', type: 'case', title: 'MBB v Mahkamah', canonical: 'mbb v mahkamah', tags: ['appeal'] });
  await g.upsert({ id: 's2', type: 'statute', title: 'Employment Act 1955', canonical: 'employment act 1955' });
  await g.ingest.link('s1', 's2', 'cites', 0.9);

  const n = await g.getNode('s1');
  assert.equal(n.title, 'MBB v Mahkamah');
  assert.deepEqual(n.tags, ['appeal'], 'tags survive the meta column roundtrip');

  const nb = await g.store.neighbours('s1');
  assert.equal(nb[0].id, 's2');
  assert.equal((await g.search({ q: 'mahkamah', k: 3 }))[0].id, 's1');
  assert.equal(g.stats().nodes, 2);
  assert.equal(g.stats().edges, 1);

  await g.removeEdge(nb[0].edgeId);
  await g.removeNode('s2');
  assert.equal(g.stats().edges, 0);
});