import test from 'node:test';
import assert from 'node:assert/strict';
import { LOMClient, normalizeActNumber, buildLegislationPdfUrl, inferDocumentType } from '../../.autoclaw/memory/interfaces/lom-client.mjs';

test('normalizeActNumber strips prefix and preserves real act id', () => {
  assert.equal(normalizeActNumber('Act 1'), '1');
  assert.equal(normalizeActNumber('Act A1234'), 'A1234');
  assert.equal(normalizeActNumber('  Act 123 '), '123');
});

test('buildLegislationPdfUrl creates a LOM pdf URL', () => {
  const url = buildLegislationPdfUrl('Act 1', 'Companies Act 2016');
  assert.match(url, /lom\.agc\.gov\.my/);
  assert.match(url, /Act%20/);
});

test('inferDocumentType identifies amendments and historical acts', () => {
  assert.equal(inferDocumentType('Act A1234'), 'amendment');
  assert.equal(inferDocumentType('Act 1', { historical: true }), 'historical');
  assert.equal(inferDocumentType('Act 4'), 'principal');
});

test('LOMClient can build metadata records without a live fetch', async () => {
  const client = new LOMClient({ fetcher: null });
  const record = await client.getAct('Act 1', {
    title: 'Companies Act 2016',
    status: 'current',
    version: '2024-01-01',
  });

  assert.equal(record.act_number, '1');
  assert.equal(record.title, 'Companies Act 2016');
  assert.equal(record.source, 'LOM');
  assert.equal(record.status, 'current');
});
