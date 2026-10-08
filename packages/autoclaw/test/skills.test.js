'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const skills = require('../skills');
const { assertExpect, summarize, runGolden, runAll } = require('../skills/runner');

test('skills: every folder carries the full envelope', () => {
  const list = skills.listSkills();
  assert.equal(list.length, 11, `expected 11 skills, got ${list.length}`);
  for (const name of list) {
    const s = skills.loadSkill(name);
    assert.ok(s.meta && s.meta.id === name, `${name}: id`);
    assert.ok(s.meta.version, `${name}: version`);
    assert.ok(s.meta.kind, `${name}: kind`);
    assert.ok(s.meta.summary, `${name}: summary`);
    assert.ok(Array.isArray(s.meta.inputs) && s.meta.inputs.length, `${name}: inputs`);
    assert.ok(Array.isArray(s.meta.outputs) && s.meta.outputs.length, `${name}: outputs`);
    assert.ok(Array.isArray(s.meta.triggers) && s.meta.triggers.length, `${name}: triggers`);
    assert.ok(Array.isArray(s.meta.tags) && s.meta.tags.length, `${name}: tags`);
    assert.ok(Array.isArray(s.golden) && s.golden.length >= 3, `${name}: golden >= 3`);
    assert.ok(s.eval && Array.isArray(s.eval.metrics) && s.eval.metrics.length, `${name}: eval.metrics`);
    assert.ok(s.reference && s.reference.length > 100, `${name}: reference.md`);
    assert.ok(s.skillMd && s.skillMd.length > 100, `${name}: SKILL.md`);
  }
});

test('skills: validate() is clean', () => {
  const r = skills.validate();
  assert.equal(r.ok, true, JSON.stringify(r.problems, null, 2));
});

test('skills: escalation paths point at a real gate or log', () => {
  const fs = require('fs');
  const path = require('path');
  const { ROOT } = require('../bin/_util');
  for (const name of skills.listSkills()) {
    const { via } = skills.loadSkill(name).meta.escalation;
    assert.ok(fs.existsSync(path.join(ROOT, via)), `${name}: escalation.via "${via}" does not exist`);
  }
});

test('skills: counts reports golden + artifact markers', () => {
  const c = skills.counts();
  for (const [name, m] of Object.entries(c)) {
    assert.ok(m.golden >= 3, `${name}: expected >= 3 golden, got ${m.golden}`);
    assert.equal(m.hasEval, true, `${name}: eval`);
    assert.equal(m.hasReference, true, `${name}: reference`);
    assert.equal(m.hasSkillMd, true, `${name}: SKILL.md`);
  }
});

test('skills: loadSkill throws for an unknown name', () => {
  assert.throws(() => skills.loadSkill('does-not-exist'), /Skill not found/);
});

test('skills: assertExpect handles status / reason / verdict / contains', () => {
  assert.equal(assertExpect({ status: 'ok' }, { status: 'ok' }).ok, true);
  assert.equal(assertExpect({ status: 'failed' }, { status: 'ok' }).ok, false);
  assert.equal(assertExpect({ status: 'escalate', reason: 'x' }, { status: 'escalate', reason: 'x' }).ok, true);
  assert.equal(assertExpect({ status: 'escalate', reason: 'y' }, { status: 'escalate', reason: 'x' }).ok, false);
  assert.equal(assertExpect({ verdict: 'block' }, { verdict: 'block' }).ok, true);
  assert.equal(assertExpect({ verdict: 'pass' }, { verdict: 'block' }).ok, false);
  assert.equal(assertExpect({ text: 'Legal Memorandum' }, { contains: 'Legal' }).ok, true);
  assert.equal(assertExpect({ text: 'Nope' }, { contains: 'Legal' }).ok, false);
});

test('skills: assertExpect handles min_ / max_ bounds and max_used', () => {
  assert.equal(assertExpect({ plan: [1, 2, 3] }, { min_plan: 2 }).ok, true);
  assert.equal(assertExpect({ plan: [1] }, { min_plan: 2 }).ok, false);
  assert.equal(assertExpect({ plan: [1, 2, 3] }, { max_plan: 2 }).ok, false);
  assert.equal(assertExpect({ used: 3 }, { max_used: 5 }).ok, true);
  assert.equal(assertExpect({ used: 7 }, { max_used: 5 }).ok, false);
  // max_used is scalar, not an array — a missing `used` must fail, not pass.
  assert.equal(assertExpect({}, { max_used: 5 }).ok, false);
});

test('skills: assertExpect does exact array equality for phases / actions', () => {
  assert.equal(assertExpect({ phases: ['load', 'promote'] }, { phases: ['load', 'promote'] }).ok, true);
  assert.equal(assertExpect({ phases: ['promote', 'load'] }, { phases: ['load', 'promote'] }).ok, false);
  assert.equal(assertExpect({}, { actions: ['read'] }).ok, false);
});

test('skills: assertExpect collects every failure, not just the first', () => {
  const r = assertExpect({ status: 'failed', verdict: 'pass' }, { status: 'ok', verdict: 'block' });
  assert.equal(r.ok, false);
  assert.equal(r.failures.length, 2);
});

test('skills: runner skips when no impl is wired', async () => {
  const r = await runGolden('architect', {});
  assert.equal(r.summary.skipped, r.summary.total);
  assert.equal(r.summary.passed, 0);
});

test('skills: runner passes on a conforming impl', async () => {
  const impl = async (input) => {
    if (!input.objective) return { status: 'escalate', reason: 'ambiguous-objective' };
    return {
      status: 'ok',
      plan: [{ skill: 'issue.extract' }, { skill: 'issue.rank' }],
      risks: [{ risk: 'drift', mitigation: 'check' }],
      constraints: input.constraints || []
    };
  };
  const r = await runGolden('architect', { impl });
  assert.equal(r.summary.failed, 0, JSON.stringify(r.results, null, 2));
  assert.equal(r.summary.passed, 3);
});

test('skills: runner reports failures with reasons', async () => {
  const impl = async () => ({ status: 'wrong' });
  const r = await runGolden('architect', { impl });
  assert.equal(r.summary.failed, r.summary.total);
  for (const x of r.results) assert.ok(x.failures.length > 0, x.id);
});

test('skills: runner surfaces a thrown impl as error, never as pass', async () => {
  const r = await runGolden('architect', { impl: async () => { throw new Error('boom'); } });
  assert.equal(r.summary.error, 3);
  assert.equal(r.summary.passed, 0);
  assert.match(r.results[0].reason, /boom/);
});

test('skills: runAll covers every skill in list order', async () => {
  const r = await runAll({ impls: {} });
  assert.deepEqual(Object.keys(r), skills.listSkills());
  for (const [name, out] of Object.entries(r)) {
    assert.equal(out.summary.total, skills.loadSkill(name).golden.length, name);
  }
});

test('skills: summarize counts every status', () => {
  const s = summarize([{ status: 'passed' }, { status: 'skipped' }, { status: 'failed' }, { status: 'error' }]);
  assert.deepEqual(s, { passed: 1, skipped: 1, failed: 1, error: 1, total: 4 });
});

test('skills: the kdream envelope is executable against the real kgdream cycle', async () => {
  // Proves the `phases` grammar and that kg.createKG().store is a drop-in for
  // the store contract kgdream consumes — with the in-memory backend, so the
  // suite needs no sqlite3.
  const kg = require('../kg');
  const { createDreamer } = require('../kgdream');
  const graph = kg.createKG({ memory: true });

  const r = await runGolden('kdream', {
    impl: async ({ mode, dryRun }) => {
      const report = await createDreamer({ store: graph.store, policy: { dryRun } }).runCycle({ mode });
      return { status: report.ok ? 'ok' : 'failed', phases: report.phases, dryRun: report.dryRun };
    }
  });

  assert.equal(r.summary.failed, 0, JSON.stringify(r.results, null, 2));
  assert.equal(r.summary.passed, r.summary.total);
  assert.equal(r.summary.skipped, 0, 'the envelope is executable, not merely declared');
});