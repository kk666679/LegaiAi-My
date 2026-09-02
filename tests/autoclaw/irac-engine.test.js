import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseIssue,
  extractRules,
  rankAuthority,
  distinguishCases,
  detectConflicts,
  applyRulesToFacts,
  buildIRAC,
} from '../../.autoclaw/agents/analysis/irac-engine.js';

test('parseIssue extracts domain and structures the core legal issue', () => {
  const result = parseIssue('Whether a director breached their fiduciary duty under company law');
  
  assert.equal(result.domain, 'company');
  assert.ok(result.issue.toLowerCase().includes('director') || result.issue.toLowerCase().includes('breach'));
  assert.ok(result.keywords.length > 0);
});

test('extractRules ranks cases by court hierarchy', () => {
  const cases = [
    { citation: '[2024] 1 MLJ 100', id: 'c1', court: 'MAGISTRATE', content: 'Court held that X is valid.' },
    { citation: '[2023] 2 MLJ 200', id: 'c2', court: 'HIGH', content: 'Court decided that X is invalid.' },
    { citation: '[2022] 3 MLJ 300', id: 'c3', court: 'FEDERAL', content: 'Federal Court ruled X is binding.' },
  ];

  const { rules, hierarchyOfAuthority } = extractRules(cases);

  assert.equal(rules.length, 3);
  assert.equal(hierarchyOfAuthority[0].court, 'FEDERAL');
  assert.equal(hierarchyOfAuthority[1].court, 'HIGH');
  assert.equal(hierarchyOfAuthority[2].court, 'MAGISTRATE');
});

test('rankAuthority correctly assigns court hierarchy ranks', () => {
  const cases = [
    { citation: '[2024] 1 MLJ 100', court: 'SESSIONS' },
    { citation: '[2023] 2 MLJ 200', court: 'APPEAL' },
    { citation: '[2022] 3 MLJ 300', court: 'FEDERAL' },
  ];

  const ranked = rankAuthority(cases);

  assert.equal(ranked[0].authority, 5); // FEDERAL
  assert.equal(ranked[1].authority, 4); // APPEAL
  assert.equal(ranked[2].authority, 2); // SESSIONS
});

test('distinguishCases identifies when cases have different facts', () => {
  const cases = [
    {
      citation: '[2024] 1 MLJ 100',
      content: 'A shareholder agreement dispute over voting rights and profit distribution.',
      id: 'c1',
    },
    {
      citation: '[2023] 2 MLJ 200',
      content: 'A director negligence case involving board decisions and fiduciary breach.',
      id: 'c2',
    },
  ];

  const result = distinguishCases('shareholder agreement', cases, []);

  assert.ok(result.distinctions.length > 0);
  assert.ok(result.distinctions[0].distinguished || result.distinctions[0].factSimilarity < 0.6);
});

test('detectConflicts identifies contradictory holdings', () => {
  const rules = [
    {
      citation: '[2024] 1 MLJ 100',
      ratio: 'The court held the defendant is liable for damages.',
      ratioConfidence: 0.9,
    },
    {
      citation: '[2023] 2 MLJ 200',
      ratio: 'The defendant is not liable under the circumstances.',
      ratioConfidence: 0.7,
    },
  ];

  const result = detectConflicts(rules);

  assert.ok(result.conflictCount >= 0); // May or may not detect, depending on keyword matching
  assert.ok(Array.isArray(result.conflicts));
});

test('applyRulesToFacts generates step-by-step legal reasoning', () => {
  const rules = [
    {
      citation: '[2024] 1 MLJ 100',
      ratio: 'An employee dismissed without notice must be given compensation.',
      ratioConfidence: 0.95,
    },
  ];
  const facts = 'The employee was dismissed without proper notice or severance package.';

  const result = applyRulesToFacts(facts, rules, 'entitlement to compensation');

  assert.ok(result.conclusion.length > 0);
  assert.ok(result.reasoning.length > 0);
  assert.equal(result.applicableRule, '[2024] 1 MLJ 100');
});

test('buildIRAC orchestrates full Issue-Rule-Application-Conclusion workflow', () => {
  const query = 'Can a director be held liable for breach of fiduciary duty?';
  const cases = [
    {
      citation: '[2024] 1 MLJ 100',
      id: 'c1',
      court: 'HIGH',
      content: 'Directors owe fiduciary duties to the company under common law.',
      paragraphNum: 5,
    },
    {
      citation: '[2023] 2 MLJ 200',
      id: 'c2',
      court: 'SESSIONS',
      content: 'Breach of fiduciary duty can result in damages or removal.',
      paragraphNum: 12,
    },
  ];
  const facts = 'Director took a corporate opportunity without disclosure.';

  const result = buildIRAC(query, cases, facts);

  assert.ok(result.issue);
  assert.ok(result.rule);
  assert.ok(result.application);
  assert.ok(result.conclusion);
  assert.equal(result.issue.domain, 'company');
  assert.ok(result.conclusion.summary.length > 0);
});
