import test from 'node:test';
import assert from 'node:assert/strict';
import { runHybridRetrieval } from '../../.autoclaw/agents/retrieval/hybrid-retriever.js';

test('runHybridRetrieval ranks a direct statutory match above weaker cases', () => {
  const docs = [
    {
      id: 'case-1',
      caseName: 'Foo Sdn Bhd v Bar',
      citation: '[2024] 1 MLJ 100',
      content: 'This dispute concerns a shareholder arrangement and contractual obligations.',
      sourceType: 'case',
      jurisdiction: 'MY',
      language: 'en',
      version: 'current',
      caseDate: '2024-01-15',
      authorityScore: 0.2,
    },
    {
      id: 'act-1',
      title: 'Companies Act 2016',
      act_number: 'Act 777',
      citation: 'Companies Act 2016 (Act 777)',
      content: 'This Act regulates company formation, directors, and shareholder rights.',
      sourceType: 'legislation',
      jurisdiction: 'MY',
      language: 'en',
      version: 'current',
      authorityScore: 0.9,
    },
  ];

  const result = runHybridRetrieval(docs, 'company law shareholder rights', { topK: 2 });

  assert.equal(result.count, 2);
  assert.equal(result.results[0].title, 'Companies Act 2016');
  assert.ok(result.results[0].relevanceScore >= result.results[1].relevanceScore);
  assert.ok(result.results[0].metadata.act_number === 'Act 777' || result.results[0].metadata.act_number === '777');
});

test('runHybridRetrieval expands bilingual terms and filters by source metadata', () => {
  const docs = [
    {
      id: 'my-act',
      title: 'Akta Syarikat 2016',
      act_number: 'Act 777',
      content: 'Akta ini mengawal syarikat dan pemegang saham.',
      sourceType: 'legislation',
      jurisdiction: 'MY',
      language: 'ms',
      version: 'current',
    },
    {
      id: 'other-act',
      title: 'Companies Act 2016',
      act_number: 'Act 777',
      content: 'This act governs company law.',
      sourceType: 'legislation',
      jurisdiction: 'SG',
      language: 'en',
      version: 'current',
    },
  ];

  const result = runHybridRetrieval(docs, 'akta syarikat pemegang saham', {
    filters: { jurisdiction: 'MY', sourceType: 'legislation' },
    topK: 5,
  });

  assert.equal(result.count, 1);
  assert.equal(result.results[0].title, 'Akta Syarikat 2016');
});
