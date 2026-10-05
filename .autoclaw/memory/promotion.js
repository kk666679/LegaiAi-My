'use strict';

const { KIND } = require('./constants');

function textKey(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 160); }

// Count how often a text appears in the recent STM window.
function countOccurrences(entries, windowMs, now) {
  const counts = new Map();
  for (const e of entries) {
    if (windowMs && now - e.ts > windowMs) continue;
    const key = textKey(e.text || e.query || e.observation || '');
    if (!key) continue;
    const cur = counts.get(key) || { key, count: 0, latest: e };
    cur.count += 1;
    if (e.ts > cur.latest.ts) cur.latest = e;
    counts.set(key, cur);
  }
  return counts;
}

// Promote a single STM entry by seq (or the entry object itself).
function promoteEntry(stm, ltm, seqOrEntry, opts) {
  opts = opts || {};
  const sessionId = opts.sessionId;
  if (!sessionId) throw new Error('promoteEntry requires { sessionId }');
  const buf = stm.all(sessionId);
  const entry = typeof seqOrEntry === 'object' ? seqOrEntry : buf.find(e => e.seq === seqOrEntry);
  if (!entry) return null;
  const text = entry.text || entry.query || entry.observation || JSON.stringify(entry);
  return ltm.commit({
    kind: opts.kind || KIND.NOTE,
    text,
    tags: opts.tags || entry.tags || [],
    salience: opts.salience != null ? opts.salience : 0.6,
    source: { sessionId, seq: entry.seq, ts: entry.ts },
    metadata: { promotedFrom: 'stm', sessionId, seq: entry.seq }
  });
}

// Promote every STM item whose text appears >= minOccurrences within windowMs.
function promoteByRepetition(stm, ltm, opts) {
  opts = opts || {};
  const sessionId = opts.sessionId;
  const minOccurrences = opts.minOccurrences || 3;
  const windowMs = opts.windowMs || (24 * 60 * 60 * 1000);
  const kind = opts.kind || KIND.OBSERVATION;
  const salience = opts.salience != null ? opts.salience : 0.7;
  if (!sessionId) throw new Error('promoteByRepetition requires { sessionId }');
  const now = opts.now || Date.now();
  const counts = countOccurrences(stm.all(sessionId), windowMs, now);
  const promoted = [];
  for (const entry of counts.values()) {
    if (entry.count < minOccurrences) continue;
    const e = ltm.commit({
      kind,
      text: entry.latest.text || entry.latest.query || entry.latest.observation || entry.key,
      tags: opts.tags || entry.latest.tags || [],
      salience,
      source: { sessionId, occurrences: entry.count, window: windowMs },
      metadata: { promotedFrom: 'stm-repetition', occurrences: entry.count }
    });
    promoted.push(e);
  }
  return { promoted, count: promoted.length };
}

// Promote every recent STM entry (useful for end-of-session flush).
function promoteRecent(stm, ltm, opts) {
  opts = opts || {};
  const sessionId = opts.sessionId;
  const limit = opts.limit || 20;
  if (!sessionId) throw new Error('promoteRecent requires { sessionId }');
  const recent = stm.recent(sessionId, { limit });
  const promoted = [];
  for (const e of recent) {
    const out = promoteEntry(stm, ltm, e, opts);
    if (out) promoted.push(out);
  }
  return { promoted, count: promoted.length };
}

module.exports = { promoteEntry, promoteByRepetition, promoteRecent, countOccurrences, textKey };
