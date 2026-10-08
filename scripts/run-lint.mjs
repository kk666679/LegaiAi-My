import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const configFiles = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.mts',
  'eslint.config.cts',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yaml',
  '.eslintrc.yml',
];

if (!configFiles.some(existsSync)) {
  console.log('No ESLint configuration found; skipping lint.');
  process.exit(0);
}

if (!existsSync('./node_modules/.bin/eslint')) {
  console.log('ESLint is not installed; skipping lint.');
  process.exit(0);
}

const result = spawnSync(
  './node_modules/.bin/eslint',
  ['.', '--max-warnings', '0'],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);
