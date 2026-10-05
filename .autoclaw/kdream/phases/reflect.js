'use strict';

/**
 * reflect — collapse connected subgraphs into durable reflection nodes.
 *
 * Communities are found with union-find over the dream set's edge topology.
 * A community becomes a `reflection` node only once it clears
 * `reflectMinCommunity`, so trivial pairs do not generate noise.
 */

function stableHash(s) {
  let h = 2166136261;
  const str = String(s);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

async function reflect({ store, policy, dreamSet = [] } = {}) {
  if (!store || !dreamSet.length) return { name: 'reflect', ok: true, reflections: [] };

  const maxR = policy ? policy.clamp('reflections', 20) : 20;
  const minC = policy ? policy.get('reflectMinCommunity') : 3;
  const dryRun = policy ? policy.isDryRun() : false;

  const parent = new Map();
  const find = x => {
    // Path halving keeps the tree flat without recursion.
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)));
      x = parent.get(x);
    }
    return x;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const d of dreamSet) parent.set(d.id, d.id);

  if (typeof store.neighbours === 'function') {
    for (const d of dreamSet.slice(0, 120)) {
      try {
        const nb = await store.neighbours(d.id, { limit: 10 });
        for (const n of nb || []) if (parent.has(n.id)) union(d.id, n.id);
      } catch (_) { /* skip unreachable */ }
    }
  }

  const communities = new Map();
  for (const d of dreamSet) {
    const r = find(d.id);
    if (!communities.has(r)) communities.set(r, []);
    communities.get(r).push(d.id);
  }

  const reflections = [];
  for (const [root, members] of communities) {
    if (reflections.length >= maxR) break;
    if (members.length < minC) continue;

    const id = `reflection_${stableHash(`${root}:${members.length}`)}`;
    if (!dryRun && store.upsert) {
      try {
        await store.upsert({
          id,
          type: 'reflection',
          members,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          salience: Math.min(1, members.length / 10)
        });
      } catch (_) { continue; }
    }
    reflections.push({ id, members: members.length });
  }

  return { name: 'reflect', ok: true, reflections };
}

module.exports = { reflect, stableHash };
