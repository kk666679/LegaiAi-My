#!/usr/bin/env node
/**
 * Build all @lawmate/* packages.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const PACKAGES_DIR = join(process.cwd(), 'packages');
const TSC = join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');

const packages = readdirSync(PACKAGES_DIR)
  .filter((name) => existsSync(join(PACKAGES_DIR, name, 'package.json')))
  .filter((name) => existsSync(join(PACKAGES_DIR, name, 'tsconfig.json')))
  .map((name) => {
    const dir = join(PACKAGES_DIR, name);
    return { dir, manifest: JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) };
  });

const packageByName = new Map(packages.map((pkg) => [pkg.manifest.name, pkg]));
const ordered = [];
const visiting = new Set();
const visited = new Set();

function visit(pkg) {
  const name = pkg.manifest.name;
  if (visited.has(name)) return;
  if (visiting.has(name)) throw new Error(`Circular workspace dependency involving ${name}`);
  visiting.add(name);

  const dependencies = {
    ...pkg.manifest.dependencies,
    ...pkg.manifest.devDependencies,
    ...pkg.manifest.peerDependencies,
    ...pkg.manifest.optionalDependencies,
  };
  for (const dependency of Object.keys(dependencies)) {
    const internal = packageByName.get(dependency);
    if (internal) visit(internal);
  }

  visiting.delete(name);
  visited.add(name);
  ordered.push(pkg);
}

for (const pkg of packages) visit(pkg);

let failures = 0;
for (const pkg of ordered) {
  const result = spawnSync('node', [TSC], { cwd: pkg.dir, stdio: 'pipe', encoding: 'utf8' });
  if (result.status === 0) {
    console.log(`OK: ${pkg.manifest.name}`);
  } else {
    console.error(`FAIL: ${pkg.manifest.name}`);
    console.error(result.stderr || result.stdout);
    failures++;
  }
}

console.log(`\n${failures === 0 ? 'All' : failures + ' of ' + packages.length} packages built.`);
process.exit(failures === 0 ? 0 : 1);
