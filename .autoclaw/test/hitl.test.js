'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHITL, Policy, ReviewQueue, DECISION, REASON } = require('../hitl');

const noopTimers = { setTimeout: () => ({ fake: true }), clearTimeout: () => {} };

test('hitl: policy auto-approves high confidence', () => {
  const v = new Policy({ confidenceThreshold: 0.7 }).evaluate({ proposal: 'x', confidence: 0.95 });
  assert.equal(v.escalate, false);
});

test('hitl: policy escalates low confidence', () => {
  const v = new Policy({ confidenceThreshold: 0.7 }).evaluate({ proposal: 'x', confidence: 0.5 });
  assert.equal(v.escalate, true);
  assert.equal(v.reason, REASON.LOW_CONFIDENCE);
});

test('hitl: policy escalates on risk keyword', () => {
  const v = new Policy({ confidenceThreshold: 0.7 }).evaluate({ proposal: 'criminal liability', confidence: 0.99 });
  assert.equal(v.escalate, true);
  assert.equal(v.reason, REASON.HIGH_RISK);
});

test('hitl: gate auto path', async () => {
  const h = createHITL({ policy: { confidenceThreshold: 0.7 }, timers: noopTimers });
  const r = await h.gate.awaitDecision({ runId: 'r', proposal: 'x', confidence: 0.95 });
  assert.equal(r.decision, DECISION.APPROVED);
  assert.equal(r.automatic, true);
});

test('hitl: gate escalates then resolves', async () => {
  const h = createHITL({ policy: { confidenceThreshold: 0.7 }, timers: noopTimers });
  const p = h.gate.awaitDecision({ runId: 'r', proposal: 'x', confidence: 0.5 });
  await new Promise(r => setImmediate(r));
  const pending = h.queue.list({ status: 'pending' })[0];
  assert.ok(pending);
  h.queue.resolve(pending.id, { decision: DECISION.REJECTED, by: 'alice' });
  const v = await p;
  assert.equal(v.decision, DECISION.REJECTED);
  assert.equal(v.by, 'alice');
});

test('hitl: queue priority ordering', () => {
  const q = new ReviewQueue();
  q.enqueue({ proposal: 'low', priority: 10 });
  q.enqueue({ proposal: 'high', priority: 80 });
  q.enqueue({ proposal: 'urgent', priority: 100 });
  assert.deepEqual(q.list().map(i => i.proposal), ['urgent', 'high', 'low']);
});

test('hitl: resolve unknown throws UNKNOWN_ITEM', () => {
  const q = new ReviewQueue();
  assert.throws(() => q.resolve('nope', { decision: DECISION.APPROVED }), /Unknown item/);
});
