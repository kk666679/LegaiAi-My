import { MemoryStore } from '@lawmate/memory';
import assert from 'node:assert';

const store = new MemoryStore();

const rec = store.remember({
  agentId: 'agent://lawmate/test',
  type: 'working',
  key: 'user-preference',
  content: 'User prefers concise answers',
  metadata: { source: 'session-1' },
});

assert.ok(rec.id.startsWith('m_'));
assert.strictEqual(rec.confidence, 1);

const recalled = store.recall({
  agentId: 'agent://lawmate/test',
  query: 'concise',
});

assert.strictEqual(recalled.length, 1);
assert.strictEqual(recalled[0]?.content, 'User prefers concise answers');

// Expiry test
const expired = store.remember({
  agentId: 'agent://lawmate/test',
  type: 'session',
  key: 'temp',
  content: 'temporary data',
  expiresAt: new Date(Date.now() - 1000).toISOString(),
});
assert.ok(store.get(expired.id) === undefined, 'expired record should be gone');

// Tenant isolation
store.remember({
  agentId: 'agent://lawmate/test',
  type: 'semantic',
  key: 'tenant-a',
  content: 'Tenant A data',
  tenantId: 'tenant-a',
});

const tenantB = store.recall({
  agentId: 'agent://lawmate/test',
  tenantId: 'tenant-b',
});
assert.strictEqual(tenantB.length, 0, 'tenant B should not see tenant A data');

console.log('PASS: memory');