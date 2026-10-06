function scoreSTM(entry, q, now) {
  let s = 0;
  const text = ((entry.text || '') + ' ' + (entry.query || '') + ' ' + (entry.observation || '')).toLowerCase();
  if (q.q) {
    const needle = String(q.q).toLowerCase();
    if (text.indexOf(needle) >= 0) s += 2;
    const tokens = needle.match(/[a-z0-9]+/g) || [];
    let ov = 0;
    for (const t of tokens) if (t.length > 2 && text.indexOf(t) >= 0) ov += 1;
    s += ov * 0.5;
  }
  const ageMs = now - entry.ts;
  s += 1 / (1 + ageMs / 60000);
  return s;
}

function unifiedQuery(stm, ltm, opts) {
  opts = opts || {};
  const sessionId = opts.sessionId;
  const q = opts.q || null;
  const tags = opts.tags || [];
  const kind = opts.kind || null;
  const limit = opts.limit || 10;
  const now = opts.now || Date.now();

  const out = [];

  if (sessionId) {
    const recent = stm.all(sessionId);
    for (const e of recent) {
      out.push({
        tier: 'stm',
        id: 'stm:' + e.seq,
        seq: e.seq,
        ts: e.ts,
        text: e.text || e.query || e.observation || '',
        tags: e.tags || [],
        score: Number(scoreSTM(e, { q }, now).toFixed(4)),
        raw: e
      });
    }
  }

  const ltmHits = ltm.query({ q, tags, kind, limit: limit * 2 });
  for (const e of ltmHits) {
    out.push({
      tier: 'ltm',
      id: e.id,
      ts: e.updatedAt,
      text: e.text,
      tags: e.tags || [],
      salience: e.salience,
      score: e._score,
      raw: e
    });
  }

  out.sort((a, b) => b.score - a.score);

  // dedupe by lowered text
  const seen = new Set();
  const deduped = [];
  for (const x of out) {
    const k = String(x.text || '').toLowerCase().slice(0, 160);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    deduped.push(x);
  }
  return deduped.slice(0, limit);
}

export { unifiedQuery, scoreSTM };
