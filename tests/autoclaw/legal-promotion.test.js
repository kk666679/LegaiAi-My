import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createMemory } from '../../.autoclaw/memory/index.js';
import { buildLegislationRecord, encodeForLTM } from '../../.autoclaw/learnings/legal-knowledge.mjs';

import {
  LEGAL_STM_TYPE,
  legalResearchContext,
  addLegislation,
  addProvision,
  addDefinition,
  addRelationship,
  addVerification,
  addReasoning,
  addUncertainty,
  promoteLegislationToLTM,
  promoteSingleLegislation,
  reverifyLegislation,
} from '../../.autoclaw/learnings/legal-promotion.mjs';

// --- Helpers ---

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'legal-promo-'));
}

function makeMem() {
  const root = tmpRoot();
  return createMemory({ root, ltmFile: path.join(root, 'ltm.jsonl') });
}

function makeVerifiedRecord(opts = {}) {
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

function makeUnverifiedRecord(opts = {}) {
  return buildLegislationRecord({
    act_number: '884',
    title: 'Companies Act 2016',
    type: 'principal',
    status: 'unknown',
    source_url: 'https://lom.agc.gov.my/akta/Act%20884.pdf',
    retrieved_at: '2026-10-05T00:00:00.000Z',
    ...opts,
  });
}

// --- Legal research context ---

test('legalResearchContext: initializes STM with question', () => {
  const mem = makeMem();
  const result = legalResearchContext(mem, 'session-1', 'What does Act 884 cover?');
  assert.equal(result.tags[0], 'legal');
  assert.ok(result.tags.includes(LEGAL_STM_TYPE.QUESTION));
  assert.equal(mem.stm.size('session-1'), 1);
});

test('addLegislation: stores legislation in STM with metadata', () => {
  const mem = makeMem();
  const record = makeVerifiedRecord();
  addLegislation(mem, 'session-1', record, { verified: true, confidence: 0.9 });

  assert.equal(mem.stm.size('session-1'), 1);
  const entries = mem.stm.all('session-1');
  assert.equal(entries[0].tags.includes(LEGAL_STM_TYPE.LEGISLATION), true);
  assert.equal(entries[0].metadata.legislation.act_number, '884');
  assert.equal(entries[0].metadata.verified, true);
  assert.equal(entries[0].metadata.confidence, 0.9);
});

test('addProvision: stores provision reference in STM', () => {
  const mem = makeMem();
  addProvision(mem, 'session-1', {
    actNumber: '884',
    section: '132',
    text: 'Directors must act in good faith',
    sourceUrl: 'https://lom.agc.gov.my/akta/Act%20884.pdf',
    verified: true,
  });

  const entries = mem.stm.all('session-1');
  assert.equal(entries.length, 1);
  assert.ok(entries[0].tags.includes(LEGAL_STM_TYPE.PROVISION));
  assert.equal(entries[0].metadata.section, '132');
});

test('addDefinition: stores legal term definition in STM', () => {
  const mem = makeMem();
  addDefinition(mem, 'session-1', {
    term: 'director',
    definition: 'A person appointed to the board of a company',
    actNumber: '884',
    sourceUrl: 'https://lom.agc.gov.my/akta/Act%20884.pdf',
    verified: true,
  });

  const entries = mem.stm.all('session-1');
  assert.equal(entries.length, 1);
  assert.ok(entries[0].tags.includes('legal:term:director'));
});

test('addRelationship: stores amendment relationship in STM', () => {
  const mem = makeMem();
  addRelationship(mem, 'session-1', {
    amendsAct: '884',
    amendedBy: 'A1234',
    relationship: 'amends',
    sourceUrl: 'https://lom.agc.gov.my/akta/Act%20A1234.pdf',
  });

  const entries = mem.stm.all('session-1');
  assert.ok(entries[0].tags.includes(LEGAL_STM_TYPE.RELATIONSHIP));
  assert.equal(entries[0].metadata.relationship, 'amends');
});

test('addVerification: stores citation verification result', () => {
  const mem = makeMem();
  addVerification(mem, 'session-1', {
    actNumber: '884',
    citation: 'Act 884',
    verified: true,
    sourceUrl: 'https://lom.agc.gov.my/akta/Act%20884.pdf',
  });

  const entries = mem.stm.all('session-1');
  assert.ok(entries[0].tags.includes(LEGAL_STM_TYPE.VERIFICATION));
  assert.ok(entries[0].tags.includes('legal:verified:yes'));
  assert.equal(entries[0].metadata.verified, true);
});

test('addReasoning: stores reasoning trace in STM', () => {
  const mem = makeMem();
  addReasoning(mem, 'session-1', 'Section 132 establishes director duties', {
    confidence: 0.85,
    conclusion: 'Director duties are codified in Act 884',
  });

  const entries = mem.stm.all('session-1');
  assert.ok(entries[0].tags.includes(LEGAL_STM_TYPE.REASONING));
  assert.equal(entries[0].metadata.confidence, 0.85);
});

test('addUncertainty: stores uncertainty marker in STM', () => {
  const mem = makeMem();
  addUncertainty(mem, 'session-1', 'Act 884 s. 132', 'Source not confirmed');

  const entries = mem.stm.all('session-1');
  assert.ok(entries[0].tags.includes(LEGAL_STM_TYPE.UNCERTAINTY));
  assert.equal(entries[0].metadata.verified, false);
});

test('research session accumulates multiple context types', () => {
  const mem = makeMem();
  legalResearchContext(mem, 's1', 'Question about Act 884');
  addLegislation(mem, 's1', makeVerifiedRecord(), { verified: true, confidence: 0.9 });
  addProvision(mem, 's1', { actNumber: '884', section: '132', text: '...', sourceUrl: '...', verified: true });
  addDefinition(mem, 's1', { term: 'director', definition: '...', actNumber: '884', sourceUrl: '...', verified: true });
  addReasoning(mem, 's1', 'reasoning text', { confidence: 0.8 });

  assert.equal(mem.stm.size('s1'), 5);
});

// --- Promotion with provenance validation ---

test('promoteLegislationToLTM: promotes verified legislation', () => {
  const mem = makeMem();
  legalResearchContext(mem, 's1', 'Question');
  addLegislation(mem, 's1', makeVerifiedRecord(), { verified: true, confidence: 0.9 });

  const result = promoteLegislationToLTM(mem, 's1');
  assert.equal(result.count, 1);
  assert.equal(mem.ltm.entries.size, 1);
  assert.equal(result.promoted[0].action, 'new-entry');
});

test('promoteLegislationToLTM: skips unverified legislation', () => {
  const mem = makeMem();
  legalResearchContext(mem, 's1', 'Question');
  addLegislation(mem, 's1', makeUnverifiedRecord(), { verified: false, confidence: 0.3 });

  const result = promoteLegislationToLTM(mem, 's1');
  assert.equal(result.count, 0);
  assert.ok(result.skipped.length > 0);
  assert.ok(result.skipped[0].reason.includes('status') || result.skipped[0].reason.includes('confidence') || result.skipped[0].reason.includes('provenance'));
});

test('promoteLegislationToLTM: skips low-confidence legislation', () => {
  const mem = makeMem();
  legalResearchContext(mem, 's1', 'Question');
  addLegislation(mem, 's1', makeVerifiedRecord(), { verified: true, confidence: 0.5 });

  const result = promoteLegislationToLTM(mem, 's1', { minConfidence: 0.8 });
  assert.equal(result.count, 0);
  assert.ok(result.skipped.some(s => s.reason.includes('confidence')));
});

test('promoteLegislationToLTM: skips non-authoritative provenance', () => {
  const mem = makeMem();
  const record = buildLegislationRecord({
    act_number: '884',
    title: 'Companies Act 2016',
    type: 'principal',
    status: 'current',
    version: '2024-01-01',
    source_url: 'https://lom.agc.gov.my/akta/Act%20884.pdf',
    retrieved_at: '2026-10-05T00:00:00.000Z',
    trust: 'secondary',
  });

  legalResearchContext(mem, 's1', 'Question');
  addLegislation(mem, 's1', record, { verified: true, confidence: 0.9 });

  const result = promoteLegislationToLTM(mem, 's1');
  assert.equal(result.count, 0);
  assert.ok(result.skipped.some(s => s.reason.includes('provenance')));
});

test('promoteSingleLegislation: promotes valid record', () => {
  const mem = makeMem();
  const record = makeVerifiedRecord();
  const result = promoteSingleLegislation(mem, record);

  assert.equal(result.promoted, true);
  assert.ok(result.entry);
  assert.ok(result.entry.metadata.legislation);
});

test('promoteSingleLegislation: rejects invalid provenance', () => {
  const mem = makeMem();
  const record = makeLegitRecordWithoutProvenance();
  const result = promoteSingleLegislation(mem, record);

  assert.equal(result.promoted, false);
  assert.ok(result.errors?.length > 0);
  assert.equal(mem.ltm.entries.size, 0);
});

function makeLegitRecordWithoutProvenance() {
  const record = buildLegislationRecord({
    act_number: '884',
    title: 'Test Act',
    type: 'principal',
    status: 'current',
    version: '2024-01-01',
    // Missing source_url
    retrieved_at: '2026-10-05T00:00:00.000Z',
  });
  record.provenance.source_url = null;
  return record;
}

test('promoteSingleLegislation: detects version conflict and preserves history', () => {
  const mem = makeMem();

  const v1 = makeVerifiedRecord({ version: '2023-01-01', content_hash: 'hash1' });
  const r1 = promoteSingleLegislation(mem, v1);
  assert.equal(r1.promoted, true);

  const v2 = makeVerifiedRecord({ version: '2024-01-01', content_hash: 'hash2', status: 'amended' });
  const r2 = promoteSingleLegislation(mem, v2);
  assert.equal(r2.promoted, true);
  assert.ok(r2.conflicts);
  assert.equal(r2.conflicts.type, 'version-updated');

  // History should contain the old version
  assert.equal(mem.ltm.entries.size, 1); // same ID, updated
  const decoded = mem.ltm.get(encodeForLTM(v2).id).metadata.legislation;
  assert.equal(decoded.version, '2024-01-01');
  assert.ok(decoded.history.length >= 1);
  assert.equal(decoded.history[0].version, '2023-01-01');
});

test('promoteSingleLegislation: no-op for same version', () => {
  const mem = makeMem();
  const record = makeVerifiedRecord();

  const r1 = promoteSingleLegislation(mem, record);
  assert.equal(r1.promoted, true);

  const r2 = promoteSingleLegislation(mem, record);
  assert.equal(r2.promoted, false);
  assert.ok(r2.errors?.includes('same version already in LTM'));
});

// --- Reverification ---

test('reverifyLegislation: updates trust on verification', () => {
  const mem = makeMem();
  const record = makeVerifiedRecord();
  const encoded = encodeForLTM(record);
  mem.commit(encoded);

  const updated = reverifyLegislation(mem, '884', {
    verified: true,
    sourceUrl: 'https://lom.agc.gov.my/akta/Act%20884.pdf',
    note: 'Verified against current portal version',
  });

  assert.ok(updated);
  assert.equal(updated.metadata.legislation.provenance.trust, 'authoritative');
});

test('reverifyLegislation: returns null when legislation not in LTM', () => {
  const mem = makeMem();
  const result = reverifyLegislation(mem, '9999', { verified: true, sourceUrl: '...' });
  assert.equal(result, null);
});

