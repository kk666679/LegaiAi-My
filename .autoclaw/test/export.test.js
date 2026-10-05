'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { format, renderAll, extractRefs, resolveRefs, citationsOf } = require('../export');

const sample = {
  issue: 'Whether the dismissal was unfair',
  rule: [{ id: 'R1', text: 'Employment Act 1955 s.14' }],
  application: 'The facts engage s.14.',
  conclusion: 'The dismissal was likely unfair.',
  retrieved: [{ id: 'R1', title: 'Employment Act 1955 s.14', source: 'Act 265', score: 0.9123 }],
  validation: { outcome: 'accepted', tally: { yes: 2, no: 1, abstain: 0 }, avgConfidence: 0.8234 }
};

test('export: irac includes all headings + citation', () => {
  const s = format(sample, 'irac');
  for (const h of ['# IRAC Analysis', '## Issue', '## Rule', '## Application', '## Conclusion', '## Citations']) assert.ok(s.includes(h), h);
  assert.match(s, /\[1\] Employment Act 1955 s\.14/);
});

test('export: memo includes To/Re/Validation', () => {
  const s = format(sample, 'memo', { to: 'Client', subject: 'UD test' });
  assert.ok(s.includes('**To:** Client'));
  assert.ok(s.includes('## VI. Validation'));
  assert.ok(s.includes('82.3%'));
});

test('export: json roundtrips', () => {
  const s = format(sample, 'json');
  assert.equal(JSON.parse(s).issue, sample.issue);
});

test('export: html wraps in article + cites anchor', () => {
  const s = format(sample, 'html');
  assert.ok(s.startsWith('<article'));
  assert.ok(s.includes('id="cite-1"'));
  assert.ok(s.includes('</article>'));
});

test('export: renderAll returns 5 formats with mime + text', () => {
  const all = renderAll(sample);
  assert.deepEqual(Object.keys(all).sort(), ['citations', 'html', 'irac', 'json', 'memo']);
  for (const v of Object.values(all)) { assert.ok(v.mime); assert.ok(typeof v.text === 'string' && v.text.length > 0); }
});

test('export: extractRefs + resolveRefs', () => {
  const refs = extractRefs('See [R1] and [R2], not [X9].');
  assert.deepEqual([...refs].sort(), ['R1', 'R2', 'X9']);
  const { resolved, unresolved } = resolveRefs(refs, [{ id: 'R1' }, { id: 'R2' }]);
  assert.deepEqual(resolved.sort(), ['R1', 'R2']);
  assert.deepEqual(unresolved, ['X9']);
});

test('export: unknown format throws UNKNOWN_FORMAT', () => {
  assert.throws(() => format(sample, 'nope'), /Unknown format/);
});

test('export: citationsOf normalizes shape', () => {
  const c = citationsOf(sample.retrieved);
  assert.equal(c[0].index, 1);
  assert.equal(c[0].score, 0.9123);
});
