'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Registry, defaultRegistry } = require('../registry');
const errors = require('../registry');

test('registry: default has 11 agents / 4 models / 17 skills', () => {
  const c = defaultRegistry.snapshot().counts;
  assert.equal(c.agents, 11);
  assert.equal(c.models, 4);
  assert.equal(c.skills, 17);
});

test('registry: integrity has no problems', () => {
  const p = defaultRegistry.integrity();
  assert.equal(p.length, 0, JSON.stringify(p));
});

test('registry: unimplemented agent throws NOT_IMPLEMENTED', async () => {
  const r = new Registry();
  const a = r.getAgent('issue-spotter');
  await assert.rejects(() => a.invoke({}), /no impl/);
});

test('registry: registerAgentImpl + invoke round-trip', async () => {
  const r = new Registry();
  r.registerAgentImpl('issue-spotter', async ({ query }) => ({ issues: [query] }));
  const out = await r.getAgent('issue-spotter').invoke({ query: 'x' });
  assert.deepEqual(out, { issues: ['x'] });
});

test('registry: unknown model throws in strict mode', () => {
  assert.throws(() => new Registry().getModel('nope'), /Unknown model/);
});

test('registry: duplicate agent impl throws', () => {
  const r = new Registry();
  r.registerAgentImpl('issue-spotter', async () => ({}));
  assert.throws(() => r.registerAgentImpl('issue-spotter', async () => ({})), /Duplicate/);
});

test('registry: error classes are exported', () => {
  for (const k of ['RegistryError', 'UnknownAgentError', 'UnknownModelError', 'UnknownSkillError', 'SchemaError', 'DuplicateError', 'NotImplementedError']) {
    assert.equal(typeof errors[k], 'function', k);
  }
});
