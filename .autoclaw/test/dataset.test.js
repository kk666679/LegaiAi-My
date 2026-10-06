import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAll, validate, counts, GROUPS } from '../dataset.js';

test('dataset: loadAll returns non-empty groups', () => {
  const all = loadAll();
  for (const g of GROUPS) {
    assert.ok(all[g], `group ${g} present`);
    assert.ok(Object.keys(all[g]).length > 0, `group ${g} not empty`);
  }
});

test('dataset: validate() reports ok', () => {
  const r = validate();
  assert.equal(r.ok, true, JSON.stringify(r.problems));
});

test('dataset: cases have id + input', () => {
  const all = loadAll();
  for (const c of all.cases.irac) { assert.ok(c.id); assert.ok(c.input); }
  for (const c of all.cases.ask)  { assert.ok(c.id); assert.ok(c.input); }
});

test('dataset: counts() tallies records', () => {
  const c = counts();
  assert.ok(c.seed['kg-nodes'] >= 3);
  assert.ok(c.consensus.ballots >= 3);
});
