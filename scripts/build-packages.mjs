#!/usr/bin/env node
/**
 * Build all @lawmate/* packages.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const PACKAGES_DIR = join(process.cwd(), 'packages');
const TSC = join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');

const packages = readdirSync(PACKAGES_DIR)
  .filter((name) => existsSync(join(PACKAGES_DIR, name, 'package.json')))
  .filter((name) => existsSync(join(PACKAGES_DIR, name, 'tsconfig.json')));

let failures = 0;
for (const pkg of packages) {
  const dir = join(PACKAGES_DIR, pkg);
  const result = spawnSync('node', [TSC], { cwd: dir, stdio: 'pipe', encoding: 'utf8' });
  if (result.status === 0) {
    console.log(`OK: @lawmate/${pkg}`);
  } else {
    console.error(`FAIL: @lawmate/${pkg}`);
    console.error(result.stderr || result.stdout);
    failures++;
  }
}

console.log(`\n${failures === 0 ? 'All' : failures + ' of ' + packages.length} packages built.`);
process.exit(failures === 0 ? 0 : 1);
