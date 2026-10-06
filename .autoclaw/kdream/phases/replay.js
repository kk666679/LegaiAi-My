/**
 * replay — choose the dream set: which nodes this cycle is allowed to touch.
 *
 * Score is a weighted blend of recency, salience and access frequency, then
 * one hop of neighbour expansion so a freshly-linked node is not missed just
 * because it has never been queried directly.
 */

function canonical(node) {
  return String(node.canonical || node.title || node.name || node.id || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function replay({ store, policy, dreamSetIn = [], input = {} } = {}) {
  if (!store) return { name: 'replay', ok: false, notes: ['no store'], dreamSet: [] };

  const limit = policy ? policy.clamp('nodes', input.limit || 200) : (input.limit || 200);
  const now = Date.now();

  let nodes = [];
  if (typeof store.listNodes === 'function') nodes = await store.listNodes({ limit: limit * 4 });
  else if (typeof store.search === 'function') nodes = await store.search({ q: '*', k: limit * 4 });

  const scored = (nodes || []).map(n => {
    const ageDays = n.lastSeen ? (now - n.lastSeen) / 86400000 : 30;
    const recency = 1 / (1 + Math.max(0, ageDays));
    const salience = Number(n.salience || 0.5);
    const access = Math.min(1, (Number(n.accessCount) || 0) / 10);
    return {
      id: n.id,
      weight: 0.5 * recency + 0.35 * salience + 0.15 * access,
      canonical: canonical(n)
    };
  });

  scored.sort((a, b) => b.weight - a.weight);
  const dreamSet = scored.slice(0, limit);

  if (typeof store.neighbours === 'function' && dreamSet.length) {
    const seen = new Set(dreamSet.map(d => d.id));
    for (const d of dreamSet.slice(0, Math.ceil(limit / 2))) {
      try {
        const nb = await store.neighbours(d.id, { limit: 10 });
        for (const n of nb || []) {
          if (seen.has(n.id)) continue;
          seen.add(n.id);
          // Reachable but not directly scored — carry half the parent's weight.
          dreamSet.push({ id: n.id, weight: d.weight * 0.5, via: d.id });
        }
      } catch (_) { /* a single unreachable node must not abort the phase */ }
    }
  }

  return { name: 'replay', ok: true, dreamSet };
}

;

export { replay, canonical };
