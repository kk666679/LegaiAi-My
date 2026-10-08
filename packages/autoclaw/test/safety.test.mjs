import test from 'node:test';
import assert from 'node:assert/strict';
import { Safety } from '../safety/index.js';
import { ApprovalGate } from '../safety/approval/approval-gate.js';

test('safety: cautious mode requires approval for writes', async () => {
  const safety = new Safety();
  safety.mode = 'cautious';
  safety.killSwitch.check = async () => ({ allowed: true });
  safety.cost.check = async () => ({ allowed: true });
  safety.tools.check = async () => ({ allowed: true });
  safety.adversarial.check = async () => ({ allowed: true });
  safety.pii.check = async () => ({ allowed: true });
  safety.content.check = async () => ({ allowed: true });
  safety.approval.check = async () => ({ required: false });
  safety.audit.record = async () => {};

  let requested = false;
  safety.approval.request = async () => {
    requested = true;
    return { allowed: true, requestId: 'test-request' };
  };

  const result = await safety.check({ action: 'write-file' });
  assert.equal(result.allowed, true);
  assert.equal(requested, true);
  assert.equal(result.results.find((entry) => entry.guard === 'safety_mode').requiresApproval, true);
});

test('safety: readonly mode denies writes without requesting approval', async () => {
  const safety = new Safety();
  safety.mode = 'readonly';
  safety.killSwitch.check = async () => ({ allowed: true });
  safety.audit.record = async () => {};

  const result = await safety.check({ action: 'write-file' });
  assert.equal(result.allowed, false);
  assert.equal(result.guard, 'safety_mode');
});

test('safety: approval gate matches destructive action patterns', async () => {
  const gate = new ApprovalGate();
  assert.equal((await gate.check({ action: 'delete-document' })).required, true);
  assert.equal((await gate.check({ action: 'read-document' })).required, false);
});
