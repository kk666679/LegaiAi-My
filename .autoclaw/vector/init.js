#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const dir = __dirname;
const dbPath = path.join(dir, 'db.sqlite');
const schema = fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8');

function hasSqlite() {
  try { execFileSync('sqlite3', ['-version'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

if (!hasSqlite()) {
  console.log('[vector] sqlite3 not on PATH — schema.sql is ready; skipping DB creation');
  process.exit(0);
}

execFileSync('sqlite3', [dbPath], { input: schema });
console.log('[vector] initialized', dbPath);
