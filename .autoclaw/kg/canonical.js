'use strict';

/**
 * canonical — pure key helpers shared by the store, the ingest path and the
 * dream cycle. Nothing here touches the filesystem or the database.
 */

/**
 * Canonical key for a node: lowercased, punctuation collapsed to single
 * spaces. Two nodes with the same canonical key are the same concept.
 */
function canonicalKey(node) {
  if (!node) return '';
  const raw = node.canonical || node.title || node.name || node.id || '';
  return String(raw).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Direction-independent edge key: (a,x,b) and (b,x,a) collapse to one id. */
function edgeKey(a, b, rel = 'related') {
  const [x, y] = [String(a || ''), String(b || '')].sort();
  return `${x}::${rel}::${y}`;
}

/** FNV-1a, base36. Deterministic across processes — safe as an id suffix. */
function stableHash(s) {
  let h = 2166136261;
  const str = String(s);
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

module.exports = { canonicalKey, edgeKey, stableHash, slugify };