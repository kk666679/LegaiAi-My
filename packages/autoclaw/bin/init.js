#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { ROOT } from './_util.js';

'use strict';

const stores = [
  { name: 'kg', db: path.join(ROOT, 'kg', 'kg.db'), schema: path.join(ROOT, 'kg', 'schema.sql') },
  { name: 'spine', db: path.join(ROOT, 'spine', 'spine.db'), schema: path.join(ROOT, 'spine', 'schema.sql') },
  { name: 'vector', db: path.join(ROOT, 'vector', 'db.sqlite'), schema: path.join(ROOT, 'vector', 'schema.sql') }
];

function hasSqlite() {
  try {
    execFileSync('sqlite3', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

if (!hasSqlite()) {
  console.log('[init] sqlite3 not on PATH — schema files are ready; skipping DB initialization');
  process.exit(0);
}

for (const store of stores) {
  const schema = fs.readFileSync(store.schema, 'utf8');
  fs.mkdirSync(path.dirname(store.db), { recursive: true });
  execFileSync('sqlite3', [store.db], { input: schema, stdio: ['pipe', 'pipe', 'inherit'] });
  console.log(`[init] ${store.name} -> ${store.db}`);
}
