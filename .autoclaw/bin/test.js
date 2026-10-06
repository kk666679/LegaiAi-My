#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

'use strict';
/**
 * Portable test entrypoint.
 *
 * `node --test test/` is not a valid directory target on every Node 18+ build
 * (it resolves as a module path on Node 24), so expand the glob here and pass
 * explicit files.
 */

const root = path.resolve(import.meta.dirname, '..');
const testDir = path.join(root, 'test');

if (!fs.existsSync(testDir)) {
  console.error('[test] no test/ directory');
  process.exit(1);
}

const files = fs.readdirSync(testDir)
  .filter(f => f.endsWith('.test.js'))
  .sort()
  .map(f => path.join('test', f));

if (!files.length) {
  console.error('[test] no *.test.js files found');
  process.exit(1);
}

const extra = process.argv.slice(2);
const r = spawnSync(process.execPath, ['--test', ...files, ...extra], { cwd: root, stdio: 'inherit' });
process.exit(r.status == null ? 1 : r.status);
