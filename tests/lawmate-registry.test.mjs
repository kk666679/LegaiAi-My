import { RegistryCatalog } from '@lawmate/registry';
import assert from 'node:assert';

const registry = new RegistryCatalog();

registry.register({
  id: 'tool://lawmate/web-search',
  name: 'Web Search',
  kind: 'tool',
  version: '1.0.0',
  capabilities: ['search'],
  status: 'active',
});

const found = registry.get('tool://lawmate/web-search');
assert.ok(found, 'registry should return the registered entry');
assert.strictEqual(found?.name, 'Web Search');

const byKind = registry.findByKind('tool');
assert.strictEqual(byKind.length, 1);

const byCap = registry.findByCapability('search');
assert.strictEqual(byCap.length, 1);

const stats = registry.stats();
assert.strictEqual(stats.total, 1);
assert.strictEqual(stats.byKind['tool'], 1);

console.log('PASS: registry');