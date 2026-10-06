import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  LEGAL_TYPE,
  LEGAL_STATUS,
  TRUST_LEVEL,
  AGC_SOURCE_URL,
  legalEntryId,
  legalTags,
  legalText,
  legalSalience,
  encodeForLTM,
  decodeFromLTM,
  detectVersionConflict,
  resolveVersionConflict,
  validateProvenance,
  legalScore,
  buildLegislationRecord,
} from '../../.autoclaw/learnings/legal-knowledge.mjs';

import {
  normalizeActNumber,
  compareVersions,
  contentHash,
  buildProvenance,
} from '../../.autoclaw/memory/interfaces/lom-client.mjs';

import { createMemory } from '../../.autoclaw/memory/index.js';

// --- Helpers ---

function makeLegitRecord(opts = {}) {
  return buildLegislationRecord({
    act_number: '884',
    title: 'Companies Act 2016',
    type: 'principal',
    status: 'current',
    version: '2024-01-01',
    source_url: 'https://lom.agc.gov.my/akta/Act%20884.pdf',
    retrieved_at: '2026-10-05T00:00:00.000Z',
    ...opts,
  });
}

function makeAmendmentRecord(opts = {}) {
  return buildLegislationRecord({
    act_number: 'A1234',
    title: 'An Act to amend the Companies Act 2016',
    type: 'amendment',
    status: 'current',
    parent_act: '884',
    source_url: 'https://lom.agc.gov.my/akta/Act%20A1234.pdf',
    retrieved_at: '2026-10-05T00:00:00.000Z',
    ...opts,
  });
}

function makePURecord(opts = {}) {
  return buildLegislationRecord({
    act_number: 'P.U.(A) 123',
    title: 'Companies (Accounts) Rules 2019',
    type: 'pu_a',
    status: 'current',
    parent_act: '884',
    source_url: 'https://lom.agc.gov.my/pu/Act%20P.U.(A)%20123.pdf',
    retrieved_at: '2026-10-05T00:00:00.000Z',
    ...opts,
  });
}

function makeUntrustedRecord(opts = {}) {
  return buildLegislationRecord({
    act_number: '884',
    title: 'Companies Act 2016',
    type: 'principal',
    status: 'current',
    version: '2024-01-01',
    source_url: 'https://lom.agc.gov.my/akta/Act%20884.pdf',
    retrieved_at: '2026-10-05T00:00:00.000Z',
    trust: 'uncertain',
    ...opts,
  });
}

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'legal-ltm-'));
}

// --- Legislation record construction ---

test('buildLegislationRecord populates all required fields', () => {
  const record = makeLegitRecord();
  assert.equal(record.act_number, '884');
  assert.equal(record.title, 'Companies Act 2016');
  assert.equal(record.type, 'principal');
  assert.equal(record.status, 'current');
  assert.equal(record.jurisdiction, 'MY');
  assert.equal(record.source, 'LOM');
  assert.ok(record.provenance);
  assert.ok(record.content_hash);
  assert.ok(Array.isArray(record.history));
});

test('buildLegislationRecord never fabricates dates for unknown status', () => {
  const record = buildLegislationRecord({
    act_number: '884',
    title: 'Companies Act 2016',
    type: 'principal',
    status: 'unknown',
    source_url: 'https://lom.agc.gov.my/akta/Act%20884.pdf',
  });
  assert.equal(record.status, 'unknown');
  assert.equal(record.royal_assent, null);
  assert.equal(record.publication_date, null);
  assert.equal(record.commencement_date, null);
  assert.equal(record.provenance.trust, 'uncertain');
});

test('buildLegislationRecord preserves explicit dates when provided', () => {
  const record = buildLegislationRecord({
    act_number: '884',
    title: 'Companies Act 2016',
    type: 'principal',
    status: 'current',
    version: '2024-06-30',
    royal_assent: '2016-12-01',
    publication_date: '2016-12-15',
    commencement_date: '2017-04-15',
    source_url: 'https://lom.agc.gov.my/akta/Act%20884.pdf',
  });
  assert.equal(record.royal_assent, '2016-12-01');
  assert.equal(record.publication_date, '2016-12-15');
  assert.equal(record.commencement_date, '2017-04-15');
  assert.equal(record.provenance.trust, 'authoritative');
});

test('validateProvenance flags non-AGC source URLs', () => {
  const record = buildLegislationRecord({
    act_number: '884',
    title: 'Test Act',
    type: 'principal',
    status: 'current',
    source_url: 'https://example.com/fake-act.pdf',
    retrieved_at: '2026-10-05T00:00:00.000Z',
  });
  const validation = validateProvenance(record);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(e => e.includes('not from the authoritative AGC portal')));
});

// --- Encoding for LTM ---

test('encodeForLTM produces a valid LTM payload', () => {
  const record = makeLegitRecord();
  const entry = encodeForLTM(record);
  assert.equal(entry.id, 'legal:principal:884');
  assert.equal(entry.kind, 'legislation');
  assert.ok(entry.text.includes('Companies Act 2016'));
  assert.ok(entry.text.includes('Act 884'));
  assert.ok(entry.tags.includes('legal:act:884'));
  assert.ok(entry.tags.includes('legal:type:principal'));
  assert.ok(entry.tags.includes('legal:status:current'));
  assert.ok(entry.tags.includes('legal:jurisdiction:MY'));
  assert.equal(entry.salience, 0.9);
  assert.ok(entry.metadata.legislation);
  assert.ok(entry.metadata.provenance);
});

test('encodeForLTM uses stable per-Act-number ID', () => {
  const record = makeLegitRecord();
  const entry = encodeForLTM(record);
  assert.equal(entry.id, 'legal:principal:884');
  // Same Act → same ID even with different versions
  const updated = makeLegitRecord({ version: '2025-01-01' });
  assert.equal(encodeForLTM(updated).id, 'legal:principal:884');
});

test('encodeForLTM preserves version history in metadata.versions', () => {
  const record = makeLegitRecord({
    history: [
      { version: '2023-01-01', content_hash: 'oldhash', status: 'amended' },
    ],
  });
  const entry = encodeForLTM(record);
  assert.ok(entry.metadata.versions);
  assert.equal(entry.metadata.versions.length, 2);
  assert.equal(entry.metadata.versions[0].version, '2024-01-01');
  assert.equal(entry.metadata.versions[1].version, '2023-01-01');
  assert.equal(entry.metadata.versions[1].status, 'amended');
});

test('encodeForLTM downgrades salience for uncertain records', () => {
  const record = makeUntrustedRecord();
  const entry = encodeForLTM(record);
  assert.equal(entry.salience, 0.3);
});

// --- Decoding from LTM ---

test('decodeFromLTM roundtrips the legislation record', () => {
  const record = makeLegitRecord();
  const entry = encodeForLTM(record);
  const decoded = decodeFromLTM(entry);
  assert.equal(decoded.act_number, '884');
  assert.equal(decoded.title, 'Companies Act 2016');
  assert.equal(decoded.type, 'principal');
  assert.equal(decoded.status, 'current');
  assert.equal(decoded.provenance.source, 'LOM');
  assert.ok(decoded.content_hash);
});

test('decodeFromLTM returns null for non-legislation entries', () => {
  assert.equal(decodeFromLTM(null), null);
  assert.equal(decodeFromLTM({ kind: 'fact' }), null);
  assert.equal(decodeFromLTM({ kind: 'legislation', metadata: {} }), null);
});

// --- Tagging ---

test('legalTags includes all relevant tags', () => {
  const record = makeAmendmentRecord();
  const tags = legalTags(record);
  assert.ok(tags.includes('legal'));
  assert.ok(tags.includes('legal:act:A1234'));
  assert.ok(tags.includes('legal:type:amendment'));
  assert.ok(tags.includes('legal:status:current'));
  assert.ok(tags.includes('legal:parent:884'));
  assert.ok(tags.includes('legal:jurisdiction:MY'));
});

test('legalSalience reflects trust level', () => {
  assert.equal(legalSalience(makeLegitRecord()), 0.9);
  assert.equal(legalSalience(makeUntrustedRecord()), 0.3);
});

// --- Version conflict detection ---

test('detectVersionConflict: same hash = no conflict', () => {
  const record = makeLegitRecord();
  const entry = encodeForLTM(record);
  assert.equal(detectVersionConflict(entry, record), false);
});

test('detectVersionConflict: different content_hash = conflict', () => {
  const entry = encodeForLTM(makeLegitRecord());
  const updated = makeLegitRecord({ version: '2025-01-01', content_hash: 'different' });
  assert.equal(detectVersionConflict(entry, updated), true);
});

test('detectVersionConflict: different status = conflict', () => {
  const entry = encodeForLTM(makeLegitRecord({ status: 'current' }));
  const repealed = makeLegitRecord({ status: 'repealed' });
  assert.equal(detectVersionConflict(entry, repealed), true);
});

test('detectVersionConflict: different act_number = no conflict', () => {
  const entry = encodeForLTM(makeLegitRecord({ act_number: '884' }));
  const other = makeLegitRecord({ act_number: '885', version: '2024-01-01', content_hash: 'different' });
  assert.equal(detectVersionConflict(entry, other), false);
});

// --- Version conflict resolution ---

test('resolveVersionConflict preserves old version in history', () => {
  const v1 = makeLegitRecord({ version: '2023-01-01', content_hash: 'hash1' });
  const entry = encodeForLTM(v1);
  const v2 = makeLegitRecord({ version: '2024-01-01', content_hash: 'hash2', status: 'amended' });
  const merged = resolveVersionConflict(entry, v2);
  assert.equal(merged.version, '2024-01-01');
  assert.equal(merged.history.length, 1);
  assert.equal(merged.history[0].version, '2023-01-01');
  assert.equal(merged.history[0].content_hash, 'hash1');
});

test('resolveVersionConflict does not duplicate identical history entries', () => {
  const existingRecord = makeLegitRecord({ version: '2023-01-01', content_hash: 'abc' });
  existingRecord.history = [{ version: '2022-01-01', content_hash: 'xyz', status: 'current' }];
  const existingEntry = { kind: 'legislation', metadata: { legislation: existingRecord } };

  const updated = { ...existingRecord, version: '2023-01-01', content_hash: 'abc' };
  const merged = resolveVersionConflict(existingEntry, updated);
  const count2023 = merged.history.filter(h => h.version === '2023-01-01').length;
  assert.equal(count2023, 1);
});

// --- Provenance validation ---

test('validateProvenance: valid authoritative record', () => {
  const record = makeLegitRecord();
  const result = validateProvenance(record);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('validateProvenance: missing act_number', () => {
  const record = makeLegitRecord({ act_number: null });
  const result = validateProvenance(record);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('missing act_number'));
});

test('validateProvenance: missing source_url', () => {
  const record = makeLegitRecord();
  record.provenance = { ...record.provenance, source_url: null };
  const result = validateProvenance(record);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('source_url')));
});

test('validateProvenance: status set but version unknown', () => {
  const record = makeLegitRecord({ status: 'current', version: 'unknown' });
  const result = validateProvenance(record);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('version')));
});

test('validateProvenance: unknown status with null dates passes', () => {
  const record = buildLegislationRecord({
    act_number: '884',
    title: 'Test Act',
    type: 'principal',
    status: 'unknown',
    source_url: 'https://lom.agc.gov.my/akta/Act%20884.pdf',
    retrieved_at: '2026-10-05T00:00:00.000Z',
  });
  assert.equal(record.status, 'unknown');
  assert.equal(record.version, 'unknown');
  const result = validateProvenance(record);
  assert.equal(result.valid, true);
});

// --- Legal scoring ---

test('legalScore: exact act_number match scores highest', () => {
  const record = makeLegitRecord({ act_number: '884' });
  const score = legalScore(record, '884');
  assert.ok(score > 20);
});

test('legalScore: title keyword match', () => {
  const record = makeLegitRecord({ title: 'Companies Act 2016' });
  const score = legalScore(record, 'Companies');
  assert.ok(score > 0);
});

test('legalScore: current status boosts score', () => {
  const current = makeLegitRecord({ status: 'current' });
  const repealed = makeLegitRecord({ status: 'repealed' });
  assert.ok(legalScore(current, 'Companies') > legalScore(repealed, 'Companies'));
});

test('legalScore: authoritative trust boosts score', () => {
  const auth = makeLegitRecord();
  const untrusted = makeUntrustedRecord();
  assert.ok(legalScore(auth, 'Companies') > legalScore(untrusted, 'Companies'));
});

test('legalScore: empty/null query returns 0', () => {
  const record = makeLegitRecord();
  assert.equal(legalScore(record, ''), 0);
  assert.equal(legalScore(record, null), 0);
});

// --- LTM integration ---

test('legal record commits to LTM and is retrievable by tag', () => {
  const root = tmpRoot();
  const mem = createMemory({ root, ltmFile: path.join(root, 'ltm.jsonl') });

  const record = makeLegitRecord();
  const encoded = encodeForLTM(record);
  mem.commit(encoded);
  assert.equal(mem.ltm.entries.size, 1);

  const byTag = mem.ltm.byTag('legal:act:884');
  assert.equal(byTag.length, 1);

  const decoded = decodeFromLTM(mem.ltm.get(encoded.id));
  assert.equal(decoded.act_number, '884');
  assert.equal(decoded.title, 'Companies Act 2016');
});

test('legal record persists across memory recreate', () => {
  const root = tmpRoot();
  const ltmFile = path.join(root, 'ltm.jsonl');

  const m1 = createMemory({ root, ltmFile });
  const record = makeLegitRecord();
  m1.commit(encodeForLTM(record));
  m1.flush();

  const m2 = createMemory({ root, ltmFile });
  assert.equal(m2.ltm.entries.size, 1);
  const entry = m2.ltm.get(encodeForLTM(record).id);
  assert.ok(entry);
  assert.equal(decodeFromLTM(entry).act_number, '884');
  assert.equal(decodeFromLTM(entry).title, 'Companies Act 2016');
});

test('legal record version update preserves history in LTM', () => {
  const root = tmpRoot();
  const mem = createMemory({ root, ltmFile: path.join(root, 'ltm.jsonl') });

  const v1 = makeLegitRecord({ version: '2023-01-01', content_hash: 'hash1' });
  mem.commit(encodeForLTM(v1));

  const v2 = makeLegitRecord({ version: '2024-01-01', status: 'amended', content_hash: 'hash2' });
  const existing = mem.ltm.get(encodeForLTM(v1).id);
  assert.ok(detectVersionConflict(existing, v2));

  const merged = resolveVersionConflict(existing, v2);
  mem.commit(encodeForLTM(merged));

  const retrieved = mem.ltm.get(encodeForLTM(v2).id);
  const decoded = decodeFromLTM(retrieved);
  assert.equal(decoded.version, '2024-01-01');
  assert.equal(decoded.history.length, 1);
  assert.equal(decoded.history[0].version, '2023-01-01');
  assert.equal(decoded.history[0].content_hash, 'hash1');
});

test('multiple legislation records coexist in LTM without interference', () => {
  const root = tmpRoot();
  const mem = createMemory({ root, ltmFile: path.join(root, 'ltm.jsonl') });

  mem.commit(encodeForLTM(makeLegitRecord({ act_number: '884' })));
  mem.commit(encodeForLTM(makeAmendmentRecord({ act_number: 'A1234' })));
  mem.commit(encodeForLTM(makePURecord({ act_number: 'P.U.(A) 123' })));

  assert.equal(mem.ltm.entries.size, 3);
  assert.equal(mem.ltm.byKind('legislation').length, 3);
  assert.equal(mem.ltm.byTag('legal:act:884').length, 1);
  assert.equal(mem.ltm.byTag('legal:act:A1234').length, 1);
});

test('repealed legislation is distinguishable from current in LTM', () => {
  const root = tmpRoot();
  const mem = createMemory({ root, ltmFile: path.join(root, 'ltm.jsonl') });

  mem.commit(encodeForLTM(makeLegitRecord({ act_number: '884', status: 'current' })));
  mem.commit(encodeForLTM(makeLegitRecord({ act_number: '885', status: 'repealed', version: '2023-01-01' })));

  const byTag = mem.ltm.byTag('legal:act:885');
  assert.equal(byTag.length, 1);
  const decoded = decodeFromLTM(byTag[0]);
  assert.equal(decoded.status, 'repealed');
});

// --- Content hash and version comparison ---

test('contentHash is deterministic for same input', () => {
  const data = { act_number: '884', title: 'Companies Act 2016', type: 'principal' };
  const h1 = contentHash(data);
  const h2 = contentHash({ ...data });
  assert.equal(h1, h2);
  assert.equal(h1.length, 32);
});

test('contentHash differs for different input', () => {
  const h1 = contentHash({ act_number: '884' });
  const h2 = contentHash({ act_number: '885' });
  assert.notEqual(h1, h2);
});

test('compareVersions: later version is greater', () => {
  assert.equal(compareVersions('2024-01-01', '2023-01-01'), 1);
  assert.equal(compareVersions('2023-01-01', '2024-01-01'), -1);
  assert.equal(compareVersions('2024-01-01', '2024-01-01'), 0);
});

test('compareVersions: unknown sorts lowest', () => {
  assert.equal(compareVersions('unknown', '2024-01-01'), -1);
  assert.equal(compareVersions('2024-01-01', 'unknown'), 1);
  assert.equal(compareVersions(null, null), 0);
});
