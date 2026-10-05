'use strict';

/**
 * prune — decay every edge in the dream set and drop those below threshold.
 *
 * Decay is computed in dry-run too, so a preview reports post-decay weights
 * rather than current ones; otherwise a dry run cannot tell you what the real
 * cycle would remove.
 */

async function prune({ store, policy, dreamSet = [] } = {}) {
  if (!store) return { name: 'prune', ok: false, pruned: [], decayed: 0 };

  const maxPrunes = policy ? policy.clamp('prunes', 200) : 200;
  const threshold = policy ? policy.get('pruneThreshold') : 0.15;
  const decay = policy ? policy.get('decayFactor') : 0.95;
  const dryRun = policy ? policy.isDryRun() : false;

  /**
   * `neighbours()` may return an edge (`{id, from, to, weight}`) or a
   * neighbour node carrying its edge (`{id, edgeId, weight}`). `removeEdge`
   * and `putEdge` need the *edge* identity, so resolve it explicitly.
   */
  const edgeIdOf = e => (e && (e.edgeId != null ? e.edgeId : e.id)) || null;

  const pruned = [];
  const decayedIds = [];
  const seen = new Set();

  for (const d of dreamSet.slice(0, 200)) {
    if (typeof store.neighbours !== 'function') break;
    let edges = [];
    try { edges = await store.neighbours(d.id, { limit: 50 }); } catch (_) { continue; }

    for (const e of edges || []) {
      const eid = edgeIdOf(e);
      if (!eid || seen.has(eid)) continue;
      seen.add(eid);

      const w = Math.max(0, Math.min(1, (Number(e.weight) || 0) * decay));

      if (w < threshold) {
        if (pruned.length >= maxPrunes) continue;
        if (!dryRun && typeof store.removeEdge === 'function') {
          try { await store.removeEdge(eid); } catch (_) { continue; }
        }
        pruned.push(eid);
      } else {
        if (!dryRun && typeof store.putEdge === 'function') {
          try { await store.putEdge({ ...e, id: eid, weight: w }); } catch (_) { /* keep going */ }
        }
        decayedIds.push(eid);
      }
    }
  }

  return { name: 'prune', ok: true, pruned, decayed: decayedIds.length, decayedIds };
}

module.exports = { prune };
