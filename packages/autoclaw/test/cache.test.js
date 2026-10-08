'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { CacheStore, LRU } = require('../cache');

test('cache: LRU set/get', () => {
  const c = new LRU(3, 60000);
  c.set('a', 1); c.set('b', 2);
  assert.equal(c.get('a'), 1);
  assert.equal(c.get('b'), 2);
});

test('cache: LRU evicts oldest', () => {
  const c = new LRU(2, 60000);
  c.set('a', 1); c.set('b', 2); c.set('c', 3);
  assert.equal(c.get('a'), undefined);
  assert.equal(c.size, 2);
});

test('cache: LRU expires by TTL', () => {
  const c = new LRU(5, 0);
  c.set('a', 1);
  return new Promise(r => setTimeout(r, 5)).then(() => {
    assert.equal(c.get('a'), undefined);
  });
});

test('cache: CacheStore two tiers', () => {
  const s = new CacheStore();
  s.setResponse('q', { ok: true });
  s.setEmbedding('q', [1, 2, 3]);
  assert.deepEqual(s.getResponse('q'), { ok: true });
  assert.deepEqual(s.getEmbedding('q'), [1, 2, 3]);
});

test('cache: stats track hits/misses', () => {
  const s = new CacheStore();
  s.setResponse('a', 1);
  s.getResponse('a'); s.getResponse('b');
  const stats = s.stats();
  assert.equal(stats.responses.hits, 1);
  assert.equal(stats.responses.misses, 1);
});
