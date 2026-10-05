'use strict';

/**
 * enrich — add inferred edges between nodes that are frequently co-accessed.
 *
 * Ids derive from a hash of the endpoint pair, so re-running the cycle updates
 * the same inferred edges instead of accumulating duplicates.
 */

function edgeKey(a, b) {
  const [x, y] = [String(a), String(b)].sort();
  return `${x}::inferred::${y}`;
}

function stableHash(s) {
  let h = 2166136261;
  const str = String(s);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

async function enrich({ store, policy, dreamSet = [] } = {}) {
  if (!store || typeof store.putEdge !== 'function' || !dreamSet.length) {
    return { name: 'enrich', ok: true, added: [] };
  }

  const maxAdded = policy ? policy.clamp('edgesAdded', 300) : 300;
  const minCo = policy ? policy.get('enrichMinCoAccess') : 2;
  const dryRun = policy ? policy.isDryRun() : false;

  const nbrs = new Map();
  for (const d of dreamSet.slice(0, 150)) {
    if (typeof store.neighbours !== 'function') break;
    try {
      const nb = await store.neighbours(d.id, { limit: 20 });
      nbrs.set(d.id, new Set((nb || []).map(x => x.id)));
    } catch (_) { /* skip unreachable */ }
  }

  const added = [];
  const nodes = [...nbrs.keys()];
  outer:
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (added.length >= maxAdded) break outer;
      const a = nodes[i];
      const b = nodes[j];
      let overlap = 0;
      for (const x of nbrs.get(a)) if (nbrs.get(b).has(x)) overlap++;
      if (overlap < minCo) continue;

      const key = edgeKey(a, b);
      if (!dryRun) {
        try {
          await store.putEdge({
            id: `inf_${stableHash(key)}`,
            from: a,
            to: b,
            rel: 'inferred',
            inferred: true,
            weight: Math.min(1, overlap / 10),
            updatedAt: Date.now()
          });
        } catch (_) { continue; }
      }
      added.push(key);
    }
  }

  return { name: 'enrich', ok: true, added };
}

module.exports = { enrich, edgeKey, stableHash };
