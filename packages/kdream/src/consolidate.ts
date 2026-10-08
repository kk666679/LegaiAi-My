import type { ConsolidatableRecord, ConsolidationResult } from './record.js';

function overlap(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const wb = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  let common = 0;
  for (const w of wa) if (wb.has(w)) common++;
  return common / Math.max(wa.size, wb.size, 1);
}

export function consolidate(
  records: ConsolidatableRecord[],
  threshold = 0.6
): ConsolidationResult[] {
  const buckets = new Map<string, ConsolidatableRecord[]>();
  for (const r of records) {
    const key = `${r.agentId}:${r.type}`;
    const list = buckets.get(key);
    if (list) list.push(r);
    else buckets.set(key, [r]);
  }

  const results: ConsolidationResult[] = [];
  for (const group of buckets.values()) {
    const used = new Set<string>();
    for (let i = 0; i < group.length; i++) {
      const gi = group[i];
      if (!gi || used.has(gi.id)) continue;
      const cluster = [gi];
      for (let j = i + 1; j < group.length; j++) {
        const gj = group[j];
        if (!gj || used.has(gj.id)) continue;
        if (overlap(gi.content, gj.content) >= threshold) {
          cluster.push(gj);
          used.add(gj.id);
        }
      }
      if (cluster.length < 2) continue;
      const first = cluster[0];
      if (!first) continue;
      const avgConfidence = cluster.reduce((s, r) => s + r.confidence, 0) / cluster.length;
      results.push({
        mergedIds: cluster.map((r) => r.id),
        summary: first.content.slice(0, 200),
        confidence: avgConfidence,
        promoted: avgConfidence >= 0.8,
      });
    }
  }
  return results;
}
