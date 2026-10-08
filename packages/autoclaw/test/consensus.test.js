'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Consensus, alwaysYes, alwaysNo, alwaysAbstain } = require('../consensus');

function make(strategy, opts) {
  const c = new Consensus({ strategy, strategyOpts: opts });
  c.registerVoter('a', alwaysYes(0.9));
  c.registerVoter('b', alwaysNo(0.7));
  c.registerVoter('c', alwaysAbstain());
  return c;
}

test('consensus: threshold accepts on yesShare', async () => {
  const c = new Consensus({ strategy: 'threshold' });
  c.registerVoter('a', alwaysYes(0.9));
  c.registerVoter('b', alwaysYes(0.8));
  const r = await c.vote({ proposal: 'p' });
  assert.equal(r.outcome, 'accepted');
});

test('consensus: majority rejects on 1 yes / 1 no', async () => {
  const r = await make('majority').vote({ proposal: 'p' });
  assert.equal(r.outcome, 'rejected');
});

test('consensus: supermajority blocks 1/2 at ratio 0.75', async () => {
  const c = new Consensus({ strategy: 'supermajority', strategyOpts: { ratio: 0.75 } });
  c.registerVoter('a', alwaysYes(1));
  c.registerVoter('b', alwaysNo(1));
  const r = await c.vote({ proposal: 'p' });
  assert.equal(r.outcome, 'rejected');
});

test('consensus: unanimous passes only with zero no', async () => {
  const c = new Consensus({ strategy: 'unanimous' });
  c.registerVoter('a', alwaysYes(0.9));
  c.registerVoter('b', alwaysYes(0.9));
  assert.equal((await c.vote({ proposal: 'p' })).outcome, 'accepted');
  c.registerVoter('c', alwaysNo(0.9));
  assert.equal((await c.vote({ proposal: 'p' })).outcome, 'rejected');
});

test('consensus: weighted favours high-weight voter', async () => {
  const c = new Consensus({ strategy: 'weighted', strategyOpts: { weights: { a: 5, b: 1 } } });
  c.registerVoter('a', alwaysYes(1));
  c.registerVoter('b', alwaysNo(1));
  const r = await c.vote({ proposal: 'p' });
  assert.equal(r.outcome, 'accepted');
  assert.ok(r.extra.yesW > r.extra.noW);
});

test('consensus: unknown strategy throws UNKNOWN_STRATEGY', () => {
  assert.throws(() => new Consensus({ strategy: 'nope' }), /Unknown strategy/);
});

test('consensus: no voters throws NO_VOTERS', async () => {
  await assert.rejects(() => new Consensus({}).vote({ proposal: 'p' }), /No voters/);
});

test('consensus: errored voter contributes abstain ballot', async () => {
  const c = new Consensus({});
  c.registerVoter('ok', alwaysYes(0.9));
  c.registerVoter('bad', async () => { throw new Error('boom'); });
  const r = await c.vote({ proposal: 'p' });
  assert.equal(r.tally.abstain, 1);
  const bad = r.ballots.find(b => b.id === 'bad');
  assert.match(bad.rationale, /^error:/);
});
