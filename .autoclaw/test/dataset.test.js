'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const ds = require('../dataset');

test('dataset: loadAll returns 5 non-empty groups', () => {
  const all = ds.loadAll();
  for (const g of ds.GROUPS) {
    assert.ok(all[g], `group ${g} present`);
    assert.ok(Object.keys(all[g]).length > 0, `group ${g} not empty`);
  }
});

test('dataset: validate() reports ok', () => {
  const r = ds.validate();
  assert.equal(r.ok, true, JSON.stringify(r.problems));
});

test('dataset: cases have id + input', () => {
  const all = ds.loadAll();
  for (const c of all.cases.irac) { assert.ok(c.id); assert.ok(c.input); }
  for (const c of all.cases.ask)  { assert.ok(c.id); assert.ok(c.input); }
});

test('dataset: counts() tallies records', () => {
  const c = ds.counts();
  assert.ok(c.seed['kg-nodes'] >= 3);
  assert.ok(c.consensus.ballots >= 3);
});