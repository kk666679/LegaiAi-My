'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const GROUPS = Object.freeze(['seed', 'cases', 'skills', 'consensus', 'i18n']);

function listFiles(subdir, ext) {
  const abs = path.join(ROOT, subdir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter(f => f.endsWith(ext)).sort();
}

/** Parse one JSONL file. Throws with a line number so a bad fixture is locatable. */
function loadJsonl(rel) {
  const abs = path.join(ROOT, rel);
  const lines = fs.readFileSync(abs, 'utf8').split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try { out.push(JSON.parse(line)); }
    catch (e) { throw new Error(`Invalid JSONL at ${rel}:${i + 1}: ${e.message}`); }
  }
  return out;
}

function loadGroup(subdir) {
  const out = {};
  for (const f of listFiles(subdir, '.jsonl')) out[f.replace(/\.jsonl$/, '')] = loadJsonl(path.join(subdir, f));
  return out;
}

function loadAll() {
  const out = {};
  for (const g of GROUPS) out[g] = loadGroup(g);
  return out;
}

function counts() {
  const all = loadAll();
  const out = {};
  for (const [g, files] of Object.entries(all)) {
    out[g] = {};
    for (const [k, v] of Object.entries(files)) out[g][k] = Array.isArray(v) ? v.length : 1;
  }
  return out;
}

/**
 * Structural validation. Every group must be non-empty and every workflow
 * case must carry an id and an input — a fixture missing those cannot produce
 * a meaningful diff later.
 */
function validate() {
  const problems = [];
  let all;
  try { all = loadAll(); }
  catch (e) { return { ok: false, problems: [e.message], counts: {} }; }

  for (const g of GROUPS) {
    if (!all[g] || !Object.keys(all[g]).length) problems.push(`empty group: ${g}`);
  }
  for (const c of (all.cases && all.cases.irac) || []) if (!c.id || !c.input) problems.push(`bad irac case: ${c.id || '?'}`);
  for (const c of (all.cases && all.cases.ask) || []) if (!c.id || !c.input) problems.push(`bad ask case: ${c.id || '?'}`);
  return { ok: problems.length === 0, problems, counts: counts() };
}

module.exports = { ROOT, GROUPS, listFiles, loadJsonl, loadGroup, loadAll, counts, validate };