import { PolicyEngine } from '@lawmate/safety';
import assert from 'node:assert';

const engine = new PolicyEngine();

const r1 = engine.evaluate({ actor: 'u1', action: 'read', resource: 'doc:1', context: {} });
assert.strictEqual(r1.decision, 'ALLOW', 'default should be ALLOW');

engine.add({
  id: 'deny-secrets',
  name: 'Deny secrets',
  action: 'read',
  subject: '*',
  resource: 'secret:*',
  decision: 'DENY',
  priority: 10,
  enabled: true,
});

const r2 = engine.evaluate({ actor: 'u1', action: 'read', resource: 'secret:abc', context: {} });
assert.strictEqual(r2.decision, 'DENY', 'secret resource should be DENY');

engine.add({
  id: 'approve-export',
  name: 'Approve export',
  action: 'export',
  subject: '*',
  resource: 'data:*',
  decision: 'REQUIRE_APPROVAL',
  priority: 5,
  enabled: true,
});

const r3 = engine.evaluate({ actor: 'u1', action: 'export', resource: 'data:1', context: {} });
assert.strictEqual(r3.decision, 'REQUIRE_APPROVAL', 'export should REQUIRE_APPROVAL');

console.log('PASS: safety policy engine');
