import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LOMClient, normalizeActNumber, inferDocumentType } from '../../.autoclaw/memory/interfaces/lom-client.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const CATALOG_PATH = path.join(repoRoot, '.autoclaw', 'datasets', 'lom', 'catalog.jsonl');
const SCHEMA_PATH  = path.join(repoRoot, '.autoclaw', 'datasets', 'lom', 'schema.json');

async function readJsonl(p) {
  const text = await fs.readFile(p, 'utf8');
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map(JSON.parse);
}

test('LOM dataset schema file exists and declares v1 contract', async () => {
  const schema = JSON.parse(await fs.readFile(SCHEMA_PATH, 'utf8'));
  assert.equal(schema.source, 'LOM');
  assert.equal(schema.jurisdiction, 'MY');
  assert.match(schema['$schema'], /legislation-record\.v1\.json$/);
});

test('catalog.jsonl loads with required fields', async () => {
  const rows = await readJsonl(CATALOG_PATH);
  assert.ok(rows.length >= 3, 'expected at least Act 884, 883, 882 seed records');

  const required = [
    'id', 'act_number', 'type', 'status', 'source', 'retrieved_at', 'provenance',
  ];
  for (const row of rows) {
    for (const field of required) {
      assert.ok(field in row, `record missing required field: ${field}`);
    }
    assert.equal(row.source, 'LOM');
    assert.equal(row.provenance.source, 'LOM');
    assert.match(row.provenance.source_url, /^https:\/\/lom\.agc\.gov\.my\//);
  }
});

test('seed records use "unknown" status rather than fabricated dates', async () => {
  const rows = await readJsonl(CATALOG_PATH);
  for (const row of rows) {
    assert.equal(row.status, 'unknown',
      `record ${row.act_number} must use status="unknown" until LOM confirms — never fabricated`);
    assert.equal(row.royal_assent, null);
    assert.equal(row.publication_date, null);
    assert.equal(row.commencement_date, null);
  }
});

test('Act 884 / 883 / 882 sample regression: ids are deterministic', async () => {
  const rows = await readJsonl(CATALOG_PATH);
  const ids = new Set(rows.map((r) => r.id));
  assert.equal(ids.size, rows.length, 'no duplicate ids in seed catalogue');

  const acts = rows.map((r) => r.act_number).sort();
  assert.deepEqual(acts.slice(0, 3), ['882', '883', '884']);
});

test('inferDocumentType distinguishes principal / amendment / subsidiary / constitution', () => {
  assert.equal(inferDocumentType('884'), 'principal');
  assert.equal(inferDocumentType('A1620'), 'amendment');
  assert.equal(inferDocumentType('P.U.(A) 1'), 'subsidiary');
  assert.equal(inferDocumentType('Federal Constitution'), 'federal-constitution');
});

test('LOMClient re-emits seed records without network access', async () => {
  const client = new LOMClient();
  const record = await client.getAct('884', {
    docType: 'principal',
    status: 'unknown',
    sourceUrl: 'https://lom.agc.gov.my/ilims/upload/portal/akta/outputaktap/Act%20884.pdf',
  });
  assert.equal(record.act_number, '884');
  assert.equal(record.source, 'LOM');
  assert.equal(record.document_type, 'principal');
});

test('LOM sync is idempotent — second run does not create duplicates', async () => {
  // Run the sync CLI in-process by importing it would require ESM module caching;
  // we instead validate the surface-filtering logic and stable-id determinism.
  const { spawnSync } = await import('node:child_process');

  const first = spawnSync('node', ['scripts/lom-sync.mjs', 'principal'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (first.status !== 0) {
    throw new Error(`first sync failed: ${first.stderr}`);
  }
  const firstSnapshot = JSON.parse(
    await fs.readFile(path.join(repoRoot, '.autoclaw/datasets/lom/last-sync.json'), 'utf8'),
  );

  const second = spawnSync('node', ['scripts/lom-sync.mjs', 'principal'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (second.status !== 0) {
    throw new Error(`second sync failed: ${second.stderr}`);
  }
  const secondSnapshot = JSON.parse(
    await fs.readFile(path.join(repoRoot, '.autoclaw/datasets/lom/last-sync.json'), 'utf8'),
  );

  assert.equal(firstSnapshot.vectors, secondSnapshot.vectors,
    'vector count must be stable across runs (idempotency)');
  assert.equal(firstSnapshot.kgNodes, secondSnapshot.kgNodes,
    'kg node count must be stable across runs (idempotency)');
});

test('health check returns the §25 contract', async () => {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync('node', ['scripts/lom-health.mjs'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(r.status, 0);
  const report = JSON.parse(r.stdout);
  for (const k of [
    'lom_available', 'last_sync', 'records', 'indexed', 'failed',
    'vectors', 'kg_nodes', 'kg_edges', 'last_error',
  ]) {
    assert.ok(k in report, `health report missing field: ${k}`);
  }
});