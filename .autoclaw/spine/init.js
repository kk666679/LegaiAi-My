#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

'use strict';

const dir = import.meta.dirname;
const dbPath = path.join(dir, 'spine.db');
const schema = fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8');

function hasSqlite() {
  try { execFileSync('sqlite3', ['-version'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

if (!hasSqlite()) {
  console.log('[spine] sqlite3 not on PATH — schema.sql is ready; skipping DB creation');
  process.exit(0);
}

execFileSync('sqlite3', [dbPath], { input: schema, stdio: ['pipe', 'pipe', 'inherit'] });
console.log('[spine] initialized', dbPath);
