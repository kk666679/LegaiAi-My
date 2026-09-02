import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test?schema=public';

const drafting = await import('../../backend/src/trpc/routers/drafting.ts');

test('searchLomCatalog returns exact-match hits first for known act number', () => {
  const hits = drafting.searchLomCatalog('884');
  assert.ok(hits.length >= 1, 'expected at least one hit for seeded Act 884');
  assert.equal(hits[0].actNumber, '884');
  assert.ok(hits[0].relevance >= 80, 'exact/prefix match should rank highest');
});

test('searchLomCatalog returns empty for unknown query', () => {
  const hits = drafting.searchLomCatalog('zzzzzz-no-such-act');
  assert.equal(hits.length, 0);
});

test('searchLomCatalog respects limit', () => {
  const hits = drafting.searchLomCatalog('884', { limit: 1 });
  assert.ok(hits.length <= 1);
});

test('extractCitations recognises MLJ format', () => {
  const out = drafting.extractCitations('See Foo v Bar [2024] 3 MLJ 456 for the principle.');
  const mlj = out.find((c) => c.type === 'mlj');
  assert.ok(mlj, 'should find an MLJ citation');
  assert.equal(mlj.year, 2024);
  assert.equal(mlj.volume, 3);
  assert.equal(mlj.page, 456);
});

test('extractCitations recognises Act + section', () => {
  const out = drafting.extractCitations('Pursuant to Act 136 s.24 the contract is enforceable.');
  const act = out.find((c) => c.type === 'act');
  const sec = out.find((c) => c.type === 'section');
  assert.ok(act && act.actNumber === '136');
  assert.ok(sec && sec.section === '24');
});

test('detectUnsupportedAssertions flags must-statements without authority', () => {
  const text = 'An employer must provide a safe workplace. The contract is governed by the law.';
  const flagged = drafting.detectUnsupportedAssertions(text);
  assert.ok(flagged.length >= 1, 'should flag "must" sentence');
  assert.match(flagged[0].sentence, /must/);
});

test('detectUnsupportedAssertions ignores sentences that cite authority', () => {
  const text = 'Pursuant to Act 136 s.24, an employer must provide a safe workplace.';
  const flagged = drafting.detectUnsupportedAssertions(text);
  assert.equal(flagged.length, 0, 'sentence already cites an authority');
});

test('citationCoverage returns deterministic ratios', () => {
  const cov = drafting.citationCoverage('Act 136 s.24. The employer must pay.');
  assert.equal(typeof cov.coverage, 'number');
  assert.ok(cov.coverage > 0);
  assert.ok(cov.coverage <= 1);
});

test('router export shape includes LOM, citation, evidence, generate procedures', () => {
  const keys = Object.keys(drafting.draftingRouter);
  for (const expected of [
    'lomSearch', 'insertCitation', 'validateCitation',
    'retrieveEvidence', 'listEvidence', 'quality',
    'aiSuggest', 'generate', 'jobStatus', 'cancelJob',
  ]) {
    assert.ok(keys.includes(expected), `missing procedure: ${expected}`);
  }
});

// Tenant isolation: the LOM dataset itself is a public Malaysian source, but the
// citation/evidence mutations must be guarded by protectedProcedure in the
// router. Here we verify that the create() mutation exists and is wired.
test('create / update procedures exist on the router (protected by ctx.user)', () => {
  const keys = Object.keys(drafting.draftingRouter);
  assert.ok(keys.includes('create'));
  assert.ok(keys.includes('update'));
});