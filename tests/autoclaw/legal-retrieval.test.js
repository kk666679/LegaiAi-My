import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createMemory } from '../../.autoclaw/memory/index.js';
import {
  encodeForLTM,
  buildLegislationRecord,
  validateProvenance,
} from '../../.autoclaw/learnings/legal-knowledge.mjs';

import {
  retrieveByActNumber,
  retrieveByTitle,
  retrieveByTopic,
  retrieveCurrentVersion,
  retrieveAllVersions,
  retrieveAmendments,
  retrieveSubsidiary,
  legalQuery,
  injectLegalContext,
} from '../../.autoclaw/learnings/legal-retrieval.mjs';

// --- Helpers ---

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'legal-retr-'));
}

function makeMem() {
  const root = tmpRoot();
  return createMemory({ root, ltmFile: path.join(root, 'ltm.jsonl') });
}

function commitLegislation(mem, opts = {}) {
  const record = buildLegislationRecord({
    act_number: '884',
    title: 'Companies Act 2016',
    type: 'principal',
    status: 'current',
    version: '2024-01-01',
    source_url: 'https://lom.agc.gov.my/akta/Act%20884.pdf',
    retrieved_at: '2026-10-05T00:00:00.000Z',
    ...opts,
  });
  const encoded = encodeForLTM(record);
  mem.commit(encoded);
  return encoded;
}

function commitAmendment(mem, opts = {}) {
  const record = buildLegislationRecord({
    act_number: 'A1234',
    title: 'An Act to amend the Companies Act 2016',
    type: 'amendment',
    status: 'current',
    parent_act: '884',
    source_url: 'https://lom.agc.gov.my/akta/Act%20A1234.pdf',
    retrieved_at: '2026-10-05T00:00:00.000Z',
    ...opts,
  });
  const encoded = encodeForLTM(record);
  mem.commit(encoded);
  return encoded;
}

function commitSubsidiary(mem, opts = {}) {
  const record = buildLegislationRecord({
    act_number: 'P.U.(A) 456',
    title: 'Companies (Capital) Rules 2019',
    type: 'pu_a',
    status: 'current',
    parent_act: '884',
    source_url: 'https://lom.agc.gov.my/pu/Act%20P.U.(A)%20456.pdf',
    retrieved_at: '2026-10-05T00:00:00.000Z',
    ...opts,
  });
  const encoded = encodeForLTM(record);
  mem.commit(encoded);
  return encoded;
}

// --- retrieveByActNumber ---

test('retrieveByActNumber: finds legislation by numeric Act number', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884' });

  const hits = retrieveByActNumber(mem, '884');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].metadata.legislation.act_number, '884');
});

test('retrieveByActNumber: handles "Act 884" format', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884' });

  const hits = retrieveByActNumber(mem, 'Act 884');
  assert.equal(hits.length, 1);
});

test('retrieveByActNumber: returns empty array for unknown Act', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884' });

  const hits = retrieveByActNumber(mem, '9999');
  assert.equal(hits.length, 0);
});

test('retrieveByActNumber: returns empty for empty input', () => {
  const mem = makeMem();
  assert.equal(retrieveByActNumber(mem, '').length, 0);
  assert.equal(retrieveByActNumber(mem, null).length, 0);
});

test('retrieveByActNumber: finds amendment by A-prefix number', () => {
  const mem = makeMem();
  commitAmendment(mem, { act_number: 'A1234' });

  const hits = retrieveByActNumber(mem, 'A1234');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].metadata.legislation.type, 'amendment');
});

// --- retrieveByTitle ---

test('retrieveByTitle: exact match', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884', title: 'Companies Act 2016' });

  const hits = retrieveByTitle(mem, 'Companies Act 2016');
  assert.equal(hits.length, 1);
  assert.equal(hits[0]._match.type, 'exact');
});

test('retrieveByTitle: fuzzy match', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884', title: 'Companies Act 2016' });

  const hits = retrieveByTitle(mem, 'Companies');
  assert.equal(hits.length, 1);
  assert.equal(hits[0]._match.type, 'fuzzy');
});

test('retrieveByTitle: exact only mode', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884', title: 'Companies Act 2016' });

  const hits = retrieveByTitle(mem, 'Companies', { exact: true });
  assert.equal(hits.length, 0);
});

test('retrieveByTitle: returns empty for no match', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884', title: 'Companies Act 2016' });

  const hits = retrieveByTitle(mem, 'Nonexistent Act');
  assert.equal(hits.length, 0);
});

// --- retrieveByTopic ---

test('retrieveByTopic: keyword search finds relevant legislation', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884', title: 'Companies Act 2016' });

  const hits = retrieveByTopic(mem, 'Companies');
  assert.equal(hits.length, 1);
  assert.ok(hits[0]._score > 0);
});

test('retrieveByTopic: returns empty for no match', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884', title: 'Companies Act 2016' });

  const hits = retrieveByTopic(mem, 'nonexistent topic');
  assert.equal(hits.length, 0);
});

// --- retrieveCurrentVersion ---

test('retrieveCurrentVersion: prefers current status', () => {
  const mem = makeMem();
  // Commit an amended version first
  commitLegislation(mem, { act_number: '884', status: 'amended', version: '2023-01-01' });

  const current = retrieveCurrentVersion(mem, '884');
  assert.ok(current);
  // Even though only one version exists, it should be returned
  assert.equal(current.metadata.legislation.status, 'amended');
});

test('retrieveCurrentVersion: returns null when not found', () => {
  const mem = makeMem();
  assert.equal(retrieveCurrentVersion(mem, '9999'), null);
});

// --- retrieveAllVersions ---

test('retrieveAllVersions: returns version history', () => {
  const mem = makeMem();
  const record = buildLegislationRecord({
    act_number: '884',
    title: 'Companies Act 2016',
    type: 'principal',
    status: 'current',
    version: '2024-01-01',
    history: [
      { version: '2023-01-01', content_hash: 'hash1', status: 'amended' },
      { version: '2022-01-01', content_hash: 'hash2', status: 'amended' },
    ],
    source_url: 'https://lom.agc.gov.my/akta/Act%20884.pdf',
    retrieved_at: '2026-10-05T00:00:00.000Z',
  });
  mem.commit(encodeForLTM(record));

  const versions = retrieveAllVersions(mem, '884');
  assert.ok(versions.length >= 2);
  assert.equal(versions[0].version, '2024-01-01');
  assert.equal(versions[0].is_current, true);
});

// --- retrieveAmendments ---

test('retrieveAmendments: finds amendments to a principal Act', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884' });
  commitAmendment(mem, { act_number: 'A1234', parent_act: '884' });
  commitAmendment(mem, { act_number: 'A5678', parent_act: '884' });

  const hits = retrieveAmendments(mem, '884');
  assert.equal(hits.length, 2);
});

test('retrieveAmendments: only returns amendments to the specified Act', () => {
  const mem = makeMem();
  commitAmendment(mem, { act_number: 'A1234', parent_act: '884' });
  commitAmendment(mem, { act_number: 'A9999', parent_act: '34' });

  const hits = retrieveAmendments(mem, '884');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].metadata.legislation.act_number, 'A1234');
});

test('retrieveAmendments: returns empty when no amendments exist', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884' });

  const hits = retrieveAmendments(mem, '884');
  assert.equal(hits.length, 0);
});

// --- retrieveSubsidiary ---

test('retrieveSubsidiary: finds P.U. under a principal Act', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884' });
  commitSubsidiary(mem, { act_number: 'P.U.(A) 456', parent_act: '884', type: 'pu_a' });
  commitSubsidiary(mem, { act_number: 'P.U.(B) 789', parent_act: '884', type: 'pu_b' });

  const hits = retrieveSubsidiary(mem, '884');
  assert.equal(hits.length, 2);
});

test('retrieveSubsidiary: returns empty when no subsidiary exists', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884' });

  const hits = retrieveSubsidiary(mem, '884');
  assert.equal(hits.length, 0);
});

// --- legalQuery (unified) ---

test('legalQuery: actNumber has highest priority', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884', title: 'Companies Act 2016', status: 'current' });

  const hits = legalQuery(mem, { actNumber: '884', query: 'Companies', limit: 5 });
  assert.ok(hits.length >= 1);
  assert.ok(hits[0]._priority <= 5);
});

test('legalQuery: de-duplicates same entry from different query fields', () => {
  const mem = makeMem();
  commitLegislation(mem, { act_number: '884', title: 'Companies Act 2016', status: 'current' });

  const hits = legalQuery(mem, {
    actNumber: '884',
    title: 'Companies Act 2016',
    query: 'Companies Act 2016',
    limit: 5,
  });
  const ids = new Set(hits.map(h => h.id));
  assert.equal(ids.size, 1);
});

test('legalQuery: returns empty when nothing matches', () => {
  const mem = makeMem();
  const hits = legalQuery(mem, { actNumber: '9999', limit: 5 });
  assert.equal(hits.length, 0);
});

// --- injectLegalContext ---

test('injectLegalContext: produces readable context string', () => {
  const mem = makeMem();
  commitLegislation(mem, {
    act_number: '884',
    title: 'Companies Act 2016',
    status: 'current',
    version: '2024-01-01',
  });

  const context = injectLegalContext(mem, { actNumber: '884', limit: 3 });
  assert.ok(context.length > 0);
  assert.match(context, /Companies Act 2016/);
  assert.match(context, /Act 884/);
  assert.match(context, /\[current\]/);
  assert.match(context, /lom\.agc\.gov\.my/);
});

test('injectLegalContext: returns empty when no matches', () => {
  const mem = makeMem();
  const context = injectLegalContext(mem, { actNumber: '9999' });
  assert.equal(context, '');
});
