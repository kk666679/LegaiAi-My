/**
 * consolidate — merge nodes sharing a canonical key.
 *
 * The first member of each group is kept and the rest are folded into it via
 * `mergedFrom`, so the merge is traceable and reversible.
 */

async function consolidate({ store, policy, dreamSet = [] } = {}) {
  if (!store || !dreamSet.length) return { name: 'consolidate', ok: true, merges: [] };

  const maxMerges = policy ? policy.clamp('merges', 50) : 50;
  const dryRun = policy ? policy.isDryRun() : false;

  const groups = new Map();
  for (const d of dreamSet) {
    if (!d.canonical) continue;
    if (!groups.has(d.canonical)) groups.set(d.canonical, []);
    groups.get(d.canonical).push(d);
  }

  const merges = [];
  for (const [, members] of groups) {
    if (merges.length >= maxMerges) break;
    if (members.length < 2) continue;

    const kept = members[0].id;
    const removed = members.slice(1).map(m => m.id);

    if (!dryRun && store.upsert) {
      try {
        const existing = store.getNode ? await store.getNode(kept) : { id: kept };
        await store.upsert({
          ...(existing || {}),
          id: kept,
          canonical: (existing && existing.canonical) || members[0].canonical,
          mergedFrom: [...new Set([...((existing && existing.mergedFrom) || []), ...removed])],
          updatedAt: Date.now()
        });
        if (typeof store.removeNode === 'function') {
          for (const r of removed) {
            try { await store.removeNode(r); } catch (_) { /* already gone */ }
          }
        }
      } catch (_) { continue; }
    }

    merges.push({ kept, removed });
  }

  return { name: 'consolidate', ok: true, merges };
}

;

export { consolidate };
