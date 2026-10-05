'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { createMemory, ShortTermMemory, LongTermMemory, JSONLStore, promotion } = require('../memory');

function tmpRoot() { return fs.mkdtempSync(path.join(os.tmpdir(), 'autoclaw-mem-')); }

test('stm: append + recent', () => {
  const s = new ShortTermMemory({ capacity: 5 });
  s.append('a', { text: 'one' });
  s.append('a', { text: 'two' });
  s.append('a', { text: 'three' });
  const r = s.recent('a', { limit: 2 });
  assert.equal(r.length, 2);
  assert.equal(r[0].text, 'three');
  assert.equal(r[1].text, 'two');
});

test('stm: capacity eviction', () => {
  const s = new ShortTermMemory({ capacity: 3 });
  for (let i = 0; i < 10; i++) s.append('a', { text: 't' + i });
  assert.equal(s.size('a'), 3);
  assert.equal(s.all('a')[0].text, 't7');
});

test('stm: TTL eviction with clock', () => {
  let now = 1000;
  const clock = { now: () => now };
  const s = new ShortTermMemory({ capacity: 100, ttlMs: 500, clock });
  s.append('a', { text: 'old' });
  now += 600;
  s.append('a', { text: 'new' });
  assert.equal(s.size('a'), 1);
  assert.equal(s.all('a')[0].text, 'new');
});

test('stm: sessions tracked separately', () => {
  const s = new ShortTermMemory();
  s.append('a', { text: 'a1' });
  s.append('b', { text: 'b1' });
  s.append('b', { text: 'b2' });
  assert.equal(s.size('a'), 1);
  assert.equal(s.size('b'), 2);
  assert.deepEqual(s.sessions().sort(), ['a', 'b']);
});

test('ltm: commit + get', () => {
  const l = new LongTermMemory();
  const e = l.commit({ text: 'hello', tags: ['greet'], kind: 'note' });
  assert.ok(e.id);
  const got = l.get(e.id);
  assert.equal(got.text, 'hello');
  assert.equal(got.accessCount, 1);
});

test('ltm: query by text', () => {
  const l = new LongTermMemory();
  l.commit({ text: 'the court held that the dismissal was unfair', tags: ['case'] });
  l.commit({ text: 'a statute about taxes', tags: ['statute'] });
  const hits = l.query({ q: 'unfair dismissal', limit: 5 });
  assert.ok(hits.length >= 1);
  assert.match(hits[0].text, /unfair/);
});

test('ltm: query by tag', () => {
  const l = new LongTermMemory();
  l.commit({ text: 'x', tags: ['alpha'] });
  l.commit({ text: 'y', tags: ['beta'] });
  const hits = l.query({ tags: ['alpha'] });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].text, 'x');
});

test('ltm: query by kind', () => {
  const l = new LongTermMemory();
  l.commit({ text: 'a', kind: 'fact' });
  l.commit({ text: 'b', kind: 'insight' });
  const hits = l.query({ kind: 'fact' });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].text, 'a');
});

test('ltm: decay prunes below floor', () => {
  const l = new LongTermMemory({ salienceFloor: 0.5, decayFactor: 0.5 });
  l.commit({ text: 'weak', salience: 0.6 });
  l.commit({ text: 'strong', salience: 0.9 });
  const r = l.decay();
  assert.equal(r.removed, 1);
  assert.equal(l.entries.size, 1);
});

test('ltm: byTag / byKind indexes', () => {
  const l = new LongTermMemory();
  l.commit({ text: 'a', tags: ['t1', 't2'] });
  l.commit({ text: 'b', tags: ['t1'] });
  assert.equal(l.byTag('t1').length, 2);
  assert.equal(l.byTag('t2').length, 1);
});

test('ltm: remove purges indexes', () => {
  const l = new LongTermMemory();
  const e = l.commit({ text: 'a', tags: ['t'] });
  assert.equal(l.byTag('t').length, 1);
  l.remove(e.id);
  assert.equal(l.byTag('t').length, 0);
  assert.equal(l.get(e.id), null);
});

test('ltm: stats report kinds + tags', () => {
  const l = new LongTermMemory();
  l.commit({ text: 'a', kind: 'fact', tags: ['x'] });
  l.commit({ text: 'b', kind: 'fact', tags: ['x', 'y'] });
  l.commit({ text: 'c', kind: 'insight', tags: ['y'] });
  const s = l.stats();
  assert.equal(s.entries, 3);
  assert.equal(s.kinds.fact, 2);
  assert.equal(s.kinds.insight, 1);
  assert.equal(s.tags['x'], 2);
});

test('persistence: append + load roundtrip', () => {
  const root = tmpRoot();
  const file = path.join(root, 'ltm.jsonl');
  const store = new JSONLStore({ file });
  store.append({ op: 'commit', entry: { id: 'e1', text: 'hello', tags: ['t'], kind: 'note', salience: 0.7, createdAt: 1, updatedAt: 1 } });
  store.append({ op: 'commit', entry: { id: 'e2', text: 'world', tags: [], kind: 'note', salience: 0.5, createdAt: 2, updatedAt: 2 } });
  store.flush();
  const loaded = store.load();
  assert.equal(loaded.entries.size, 2);
  assert.equal(loaded.entries.get('e1').text, 'hello');
});

test('persistence: remove tombstone', () => {
  const root = tmpRoot();
  const file = path.join(root, 'ltm.jsonl');
  const store = new JSONLStore({ file });
  store.append({ op: 'commit', entry: { id: 'e1', text: 'x', tags: [], kind: 'note', salience: 0.7, createdAt: 1, updatedAt: 1 } });
  store.append({ op: 'remove', id: 'e1' });
  store.flush();
  const loaded = store.load();
  assert.equal(loaded.entries.size, 0);
});

test('persistence: hydrate into ltm', () => {
  const root = tmpRoot();
  const file = path.join(root, 'ltm.jsonl');
  const store = new JSONLStore({ file });
  store.append({ op: 'commit', entry: { id: 'e1', text: 'hi', tags: ['t'], kind: 'fact', salience: 0.8, createdAt: 1, updatedAt: 1, accessCount: 0, metadata: {} } });
  store.flush();
  const l = new LongTermMemory();
  const r = store.hydrate(l);
  assert.equal(r.hydrated, 1);
  assert.equal(l.entries.get('e1').text, 'hi');
  assert.equal(l.byTag('t').length, 1);
});

test('createMemory: facade wires both tiers', () => {
  const root = tmpRoot();
  const mem = createMemory({ root, ltmFile: require('path').join(root, 'ltm.jsonl') });
  mem.remember('s1', { text: 'turn one' });
  mem.remember('s1', { text: 'turn two' });
  mem.commit({ text: 'a fact', tags: ['t'], kind: 'fact', salience: 0.8 });
  assert.equal(mem.stm.size('s1'), 2);
  assert.equal(mem.ltm.entries.size, 1);
});

test('createMemory: query merges STM + LTM', () => {
  const root = tmpRoot();
  const mem = createMemory({ root, ltmFile: require('path').join(root, 'ltm.jsonl') });
  mem.remember('s1', { text: 'unfair dismissal in STM' });
  mem.commit({ text: 'unfair dismissal in LTM', tags: ['case'], salience: 0.9 });
  const hits = mem.query({ sessionId: 's1', q: 'unfair dismissal', limit: 5 });
  assert.ok(hits.length >= 2);
  assert.ok(hits.some(h => h.tier === 'stm'));
  assert.ok(hits.some(h => h.tier === 'ltm'));
});

test('promotion: promoteByRepetition', () => {
  const root = tmpRoot();
  const mem = createMemory({ root, ltmFile: require('path').join(root, 'ltm.jsonl') });
  mem.remember('s1', { text: 'repeat me' });
  mem.remember('s1', { text: 'repeat me' });
  mem.remember('s1', { text: 'repeat me' });
  const r = mem.promoteByRepetition({ sessionId: 's1', minOccurrences: 3 });
  assert.equal(r.count, 1);
  assert.equal(mem.ltm.entries.size, 1);
});

test('promotion: promoteRecent', () => {
  const root = tmpRoot();
  const mem = createMemory({ root, ltmFile: require('path').join(root, 'ltm.jsonl') });
  mem.remember('s1', { text: 'a' });
  mem.remember('s1', { text: 'b' });
  const r = mem.promoteRecent({ sessionId: 's1', limit: 2 });
  assert.equal(r.count, 2);
  assert.equal(mem.ltm.entries.size, 2);
});

test('createMemory: persistence survives recreate', () => {
  const root = tmpRoot();
  const file = require('path').join(root, 'ltm.jsonl');
  const m1 = createMemory({ root, ltmFile: file });
  m1.commit({ text: 'persist me', tags: ['x'], salience: 0.9 });
  m1.flush();
  const m2 = createMemory({ root, ltmFile: file });
  assert.equal(m2.ltm.entries.size, 1);
  const e = Array.from(m2.ltm.entries.values())[0];
  assert.equal(e.text, 'persist me');
});
