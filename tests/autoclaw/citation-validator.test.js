import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCitation,
  validateCitations,
  validateLegalProposition,
  checkConflictingAuthorities,
  validateCitationFormat,
  rankCitationAuthority,
} from '../../.autoclaw/agents/validation/citation-validator.js';

test('parseCitation recognizes MLJ format [YYYY] N MLJ NNN', () => {
  const result = parseCitation('[2024] 1 MLJ 100');

  assert.equal(result.format, 'MLJ');
  assert.equal(result.year, 2024);
  assert.equal(result.volume, 1);
  assert.equal(result.page, 100);
  assert.equal(result.valid, true);
});

test('parseCitation recognizes AM format [YYYY] N AM NNN', () => {
  const result = parseCitation('[2023] 2 AM 250');

  assert.equal(result.format, 'AM');
  assert.equal(result.year, 2023);
  assert.equal(result.volume, 2);
  assert.equal(result.page, 250);
  assert.equal(result.valid, true);
});

test('parseCitation marks invalid format as invalid with error message', () => {
  const result = parseCitation('This is not a citation');

  assert.equal(result.valid, false);
  assert.ok(result.error);
  assert.ok(result.error.includes('does not match'));
});

test('validateCitations counts valid and invalid citations in a batch', () => {
  const citations = [
    '[2024] 1 MLJ 100',
    '[2023] 2 AM 250',
    'Invalid citation',
    '[2022] 3 CLJ 500',
  ];

  const result = validateCitations(citations);

  assert.equal(result.total, 4);
  assert.equal(result.valid, 3);
  assert.equal(result.invalid, 1);
  assert.equal(result.allValid, false);
});

test('validateLegalProposition detects proposition with no citation', () => {
  const result = validateLegalProposition('A director must always act in the company\'s best interest', []);

  assert.ok(result.issues.length > 0);
  assert.equal(result.issues[0].code, 'NO_CITATION');
  assert.equal(result.verdict, 'INVALID');
});

test('validateLegalProposition flags absolute statements without multiple citations', () => {
  const result = validateLegalProposition('Directors can never breach their fiduciary duty', ['[2024] 1 MLJ 100']);

  const absoluteIssue = result.issues.find((i) => i.code === 'ABSOLUTE_UNQUALIFIED');
  assert.ok(absoluteIssue);
});

test('validateLegalProposition passes with valid citations', () => {
  const result = validateLegalProposition('Breach of fiduciary duty requires evidence', [
    '[2024] 1 MLJ 100',
    '[2023] 2 MLJ 200',
  ]);

  assert.equal(result.verdict, 'VALID');
  assert.ok(result.confidence > 0);
});

test('checkConflictingAuthorities detects overlapping citation years', () => {
  const citations1 = ['[2024] 1 MLJ 100', '[2022] 2 MLJ 200'];
  const citations2 = ['[2024] 1 AM 300', '[2020] 3 CLJ 400'];

  const result = checkConflictingAuthorities(citations1, citations2);

  assert.ok(result.overlappingYears.includes(2024));
  assert.equal(result.potentialConflict, true);
});

test('validateCitationFormat extracts all citations from text', () => {
  const text = 'In [2024] 1 MLJ 100, the court held X. See also [2023] 2 AM 250 for similar reasoning.';

  const result = validateCitationFormat(text);

  assert.equal(result.foundCitations, 2);
  assert.equal(result.allValid, true);
});

test('rankCitationAuthority orders citations by tier and recency', () => {
  const citations = [
    '[2020] 5 CLJ 999', // secondary, old
    '[2024] 1 MLJ 100', // primary, recent
    '[2023] 2 AM 200',  // primary, recent
  ];

  const ranked = rankCitationAuthority(citations);

  assert.equal(ranked[0].format, 'MLJ');
  assert.equal(ranked[0].rank, 1);
  assert.equal(ranked[ranked.length - 1].format, 'CLJ');
});
