'use strict';

/**
 * runner — golden-case executor.
 *
 * The runner knows nothing about any particular skill implementation. It is
 * handed one via `runGolden(name, { impl })`; `impl(input, { skill })` returns
 * an actual result object which is then asserted against the `expect` block
 * declared in `golden.jsonl`.
 *
 * With no `impl`, every case reports `skipped` — the suite is inspectable and
 * green-able before a single skill is wired.
 */

const skills = require('./index');

/**
 * Assert `actual` against a golden `expect`. Recognised keys:
 *   status   — 'ok' | 'failed' | 'escalate'
 *   reason   — required when status === 'escalate'
 *   verdict  — 'pass' | 'block'
 *   contains — substring of JSON.stringify(actual)
 *   phases   — sequence equality with actual.phases (an object entry compares its `name`)
 *   actions  — array equality with actual.actions
 *   max_used — actual.used <= value
 *   min_<f>  — actual.<f> is an array with length >= value
 *   max_<f>  — actual.<f> is an array with length <= value
 *   <flag>   — true requires actual.<flag> === true
 */
function assertExpect(actual, expect) {
  const failures = [];
  if (!expect) return { ok: true, failures };
  const has = k => Object.prototype.hasOwnProperty.call(expect, k);

  if (has('status')) {
    const got = actual && actual.status;
    if (got !== expect.status) failures.push(`status: expected "${expect.status}", got "${got}"`);
  }
  if (expect.status === 'escalate' && has('reason')) {
    const got = actual && actual.reason;
    if (got !== expect.reason) failures.push(`reason: expected "${expect.reason}", got "${got}"`);
  }
  if (has('verdict')) {
    const got = actual && actual.verdict;
    if (got !== expect.verdict) failures.push(`verdict: expected "${expect.verdict}", got "${got}"`);
  }
  if (has('contains')) {
    const text = JSON.stringify(actual === undefined ? '' : actual);
    if (!text.includes(expect.contains)) failures.push(`contains: "${expect.contains}" not found`);
  }
  for (const arr of ['phases', 'actions']) {
    if (!has(arr)) continue;
    // A report-shaped phase list is `[{ name, ok, ms }, …]`; compare the names.
    const got = ((actual && actual[arr]) || []).map(x => (x && typeof x === 'object' ? x.name : x));
    if (JSON.stringify(got) !== JSON.stringify(expect[arr])) {
      failures.push(`${arr}: expected ${JSON.stringify(expect[arr])}, got ${JSON.stringify(got)}`);
    }
  }
  if (has('max_used')) {
    const got = actual && typeof actual.used === 'number' ? actual.used : Infinity;
    if (got > expect.max_used) failures.push(`max_used: expected <=${expect.max_used}, got ${got}`);
  }

  for (const k of Object.keys(expect)) {
    if (k.startsWith('min_')) {
      const field = k.slice(4);
      const n = actual && Array.isArray(actual[field]) ? actual[field].length : 0;
      if (n < expect[k]) failures.push(`${k}: expected >=${expect[k]}, got ${n}`);
      continue;
    }
    if (k.startsWith('max_') && k !== 'max_used') {
      const field = k.slice(4);
      const n = actual && Array.isArray(actual[field]) ? actual[field].length : 0;
      if (n > expect[k]) failures.push(`${k}: expected <=${expect[k]}, got ${n}`);
      continue;
    }
    if (k === 'status' || k === 'reason' || k === 'verdict' || k === 'contains') continue;
    if (expect[k] === true && (!actual || actual[k] !== true)) {
      failures.push(`${k}: expected true, got ${actual && actual[k]}`);
    }
  }
  return { ok: failures.length === 0, failures };
}

function summarize(results) {
  const c = { passed: 0, failed: 0, skipped: 0, error: 0, total: results.length };
  for (const r of results) c[r.status] = (c[r.status] || 0) + 1;
  return c;
}

async function runGolden(skillName, { impl } = {}) {
  const s = skills.loadSkill(skillName);
  const results = [];
  for (const g of s.golden) {
    if (typeof impl !== 'function') {
      results.push({ id: g.id, status: 'skipped', reason: 'no impl' });
      continue;
    }
    let actual;
    try { actual = await impl(g.input || {}, { skill: s }); }
    catch (e) { results.push({ id: g.id, status: 'error', reason: e.message }); continue; }
    const { ok, failures } = assertExpect(actual, g.expect);
    results.push({ id: g.id, status: ok ? 'passed' : 'failed', actual, failures });
  }
  return { skill: skillName, results, summary: summarize(results) };
}

/** `impls` maps skill name -> impl function. Missing entries report `skipped`. */
async function runAll({ impls = {} } = {}) {
  const out = {};
  for (const name of skills.listSkills()) out[name] = await runGolden(name, { impl: impls[name] });
  return out;
}

module.exports = { assertExpect, summarize, runGolden, runAll };