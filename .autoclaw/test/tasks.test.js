'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { TaskRunner, defaultHandlers } = require('../tasks');

test('tasks: enqueue + complete', async () => {
  const r = new TaskRunner({ concurrency: 2 });
  r.register('demo', async () => ({ ok: 1 }));
  const j = r.enqueue('demo', {});
  await new Promise(res => r.on('completed', res));
  assert.equal(r.get(j.id).status, 'completed');
  assert.deepEqual(r.get(j.id).result, { ok: 1 });
});

test('tasks: unknown kind throws', () => {
  const r = new TaskRunner();
  assert.throws(() => r.enqueue('nope', {}), /Unknown task kind/);
});

test('tasks: failed job captures error', async () => {
  const r = new TaskRunner();
  r.register('boom', async () => { throw new Error('oops'); });
  const j = r.enqueue('boom', {});
  await new Promise(res => r.on('failed', res));
  assert.equal(r.get(j.id).status, 'failed');
  assert.equal(r.get(j.id).error.message, 'oops');
});

test('tasks: default handlers exist', () => {
  const h = defaultHandlers({});
  for (const k of ['lom.ingest', 'corpus.reindex', 'eval.run']) assert.equal(typeof h[k], 'function', k);
});

test('tasks: concurrency honoured', async () => {
  const r = new TaskRunner({ concurrency: 1 });
  let active = 0, peak = 0;
  r.register('slow', async () => {
    active++; peak = Math.max(peak, active);
    await new Promise(res => setTimeout(res, 10));
    active--;
  });
  r.enqueue('slow'); r.enqueue('slow'); r.enqueue('slow');
  await new Promise(res => r.on('completed', () => res()));
  // wait for all
  await new Promise(res => setTimeout(res, 50));
  assert.equal(peak, 1, 'should never exceed concurrency 1');
});
