#!/usr/bin/env node
/**
 * LOM dataset sync — LAW MATE `.autoclaw` LOM_DATASET_SPEC.md Phase 1+2.
 *
 * Idempotent. Re-running does not create duplicate records or duplicate vectors.
 * Reuses the existing LOMClient / VectorStore / KnowledgeGraphStore interfaces.
 *
 * Usage:
 *   node scripts/lom-sync.mjs [surface]
 *
 * Surfaces: all | principal | amendments | pu-a | pu-b | constitution
 *
 * Network calls (live LOM fetch + PDF download) are deferred to Phase 2.
 * This script:
 *   1. Loads the seed catalogue from .autoclaw/datasets/lom/catalog.jsonl
 *   2. Re-emits each record through LOMClient.getAct() (deterministic, no network)
 *   3. Indexes a single "title-marker" vector per record (idempotent by id)
 *   4. Registers a leg node in the KG under kind="legislation"
 *   5. Writes failed/permanent reports to .autoclaw/datasets/lom/{failed,retryable,permanent}.jsonl
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

import { LOMClient } from '../.autoclaw/memory/interfaces/lom-client.mjs';
import { VectorStore } from '../.autoclaw/memory/interfaces/vector-store.js';
import { KnowledgeGraphStore } from '../.autoclaw/memory/interfaces/kg-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const CATALOG_PATH = path.join(repoRoot, '.autoclaw', 'datasets', 'lom', 'catalog.jsonl');
const REPORT_DIR = path.join(repoRoot, '.autoclaw', 'datasets', 'lom');
const SNAPSHOT_PATH = path.join(REPORT_DIR, 'last-sync.json');

const VECTOR_COLLECTION = 'malaysia_legislation';
const KG_KIND = 'legislation';

function stableId(record) {
  const basis = `${record.act_number}|${record.type}|${record.content_hash ?? record.version ?? 'current'}`;
  return createHash('sha256').update(basis).digest('hex').slice(0, 16);
}

function zeroVector(dim = 16) {
  // Deterministic zero vector — placeholder until the LAW MATE embedding model is wired.
  // The shape is fixed so the retrieval interface stays stable across the migration.
  return Array.from({ length: dim }, () => 0);
}

function parseSurfaceFlag(argv) {
  const map = {
    'all': null,
    'principal': ['principal'],
    'amendments': ['amendment'],
    'pu-a': ['pu_a'],
    'pu-b': ['pu_b'],
    'constitution': ['constitution'],
  };
  const flag = argv[2] ?? 'all';
  return { flag, types: map[flag] ?? null };
}

async function readJsonl(filePath) {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeJsonl(filePath, rows) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
}

async function loadLastSnapshot() {
  try {
    const raw = await fs.readFile(SNAPSHOT_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { ids: new Set(), vectors: 0, kgNodes: 0 };
  }
}

async function run() {
  const { flag, types } = parseSurfaceFlag(process.argv);
  const catalog = (await readJsonl(CATALOG_PATH))
    .filter((r) => !types || types.includes(r.type));

  if (catalog.length === 0) {
    console.error(`No records for surface="${flag}" in ${CATALOG_PATH}`);
    process.exit(2);
  }

  const client = new LOMClient();
  const vectorStore = new VectorStore();
  const kgStore = new KnowledgeGraphStore();

  await vectorStore.ensureCollection(VECTOR_COLLECTION);

  const snapshot = await loadLastSnapshot();
  const seenIds = new Set(snapshot.ids ?? []);
  const indexed = [];
  const failed = [];
  const retryable = [];
  const permanent = [];

  for (const row of catalog) {
    try {
      const record = await client.getAct(row.act_number, {
        title: row.title_en ?? row.title_bm ?? null,
        status: row.status ?? 'unknown',
        version: row.version ?? 'current',
        historical: row.type === 'historical',
        docType: row.type,
        sourceUrl: row.provenance?.source_url,
        eliUri: row.provenance?.source_url,
      });

      const id = stableId(record);
      record.id = id;

      if (!seenIds.has(id)) {
        await vectorStore.addRecords(VECTOR_COLLECTION, [
          {
            id,
            vector: zeroVector(),
            act_number: record.act_number,
            type: record.document_type ?? row.type,
            status: record.status,
            language: record.language ?? 'en',
            version: record.version,
            section_number: null,
            source: 'LOM',
            provenance: row.provenance,
            content_hash: record.content_hash ?? null,
            retrieved_at: record.retrieved_at,
          },
        ]);

        await kgStore.addRelationship(
          KG_KIND,
          record.act_number,
          'SOURCED_FROM',
          'LOM',
          { type: row.type, version: record.version },
        );

        seenIds.add(id);
      }

      indexed.push({ id, act_number: record.act_number, type: row.type });
    } catch (err) {
      const entry = { act_number: row.act_number, type: row.type, error: String(err.message ?? err) };
      failed.push(entry);
      if (err && (err.code === 'ENOENT' || err.code === 'EACCES')) {
        permanent.push(entry);
      } else {
        retryable.push(entry);
      }
    }
  }

  await writeJsonl(path.join(REPORT_DIR, 'failed.jsonl'), failed);
  await writeJsonl(path.join(REPORT_DIR, 'retryable.jsonl'), retryable);
  await writeJsonl(path.join(REPORT_DIR, 'permanent.jsonl'), permanent);

  const summary = {
    surface: flag,
    timestamp: new Date().toISOString(),
    discovered: catalog.length,
    indexed: indexed.length,
    failed: failed.length,
    retryable: retryable.length,
    permanent: permanent.length,
    ids: [...seenIds],
    vectors: seenIds.size,
    kgNodes: seenIds.size,
  };

  await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(summary, null, 2), 'utf8');

  console.log(JSON.stringify(summary, null, 2));
}

run().catch((err) => {
  console.error('lom:sync failed:', err);
  process.exit(1);
});