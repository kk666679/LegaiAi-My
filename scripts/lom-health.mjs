#!/usr/bin/env node
/**
 * LOM health check — LAW MATE `.autoclaw` LOM_DATASET_SPEC.md §25.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const SNAPSHOT = path.join(repoRoot, '.autoclaw', 'datasets', 'lom', 'last-sync.json');
const FAILED = path.join(repoRoot, '.autoclaw', 'datasets', 'lom', 'failed.jsonl');

async function readJsonIfExists(p) {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); }
  catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function readJsonlIfExists(p) {
  try {
    const text = await fs.readFile(p, 'utf8');
    return text.split('\n').map((l) => l.trim()).filter(Boolean).map(JSON.parse);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

(async () => {
  const snapshot = await readJsonIfExists(SNAPSHOT);
  const failed = await readJsonlIfExists(FAILED);
  const ok = Boolean(snapshot);

  const report = {
    lom_available: true,
    last_sync: snapshot?.timestamp ?? null,
    records: snapshot?.discovered ?? 0,
    indexed: snapshot?.indexed ?? 0,
    failed: snapshot?.failed ?? failed.length,
    vectors: snapshot?.vectors ?? 0,
    kg_nodes: snapshot?.kgNodes ?? 0,
    kg_edges: snapshot?.kgNodes ?? 0,
    last_error: snapshot?.permanent?.length ? 'permanent failures recorded' : null,
  };

  console.log(JSON.stringify(report, null, 2));
  if (!ok) process.exit(1);
})().catch((err) => {
  console.error('lom:health failed:', err);
  process.exit(1);
});