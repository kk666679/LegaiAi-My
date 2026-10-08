import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;

export const GROUPS = Object.freeze(['seed', 'cases', 'skills', 'consensus', 'i18n', 'asean']);

export function listFiles(subdir, ext) {
  const abs = path.join(ROOT, subdir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter(f => f.endsWith(ext)).sort();
}

export function loadJsonl(rel) {
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

export function loadGroup(subdir) {
  const out = {};
  for (const f of listFiles(subdir, '.jsonl')) out[f.replace(/\.jsonl$/, '')] = loadJsonl(path.join(subdir, f));
  return out;
}

export function loadAll() {
  const out = {};
  for (const g of GROUPS) out[g] = loadGroup(g);
  return out;
}

export function counts() {
  const all = loadAll();
  const out = {};
  for (const [g, files] of Object.entries(all)) {
    out[g] = {};
    for (const [k, v] of Object.entries(files)) out[g][k] = Array.isArray(v) ? v.length : 1;
  }
  return out;
}

export function validate() {
  const problems = [];
  let all;
  try { all = loadAll(); }
  catch (e) { return { ok: false, problems: [e.message], counts: {} }; }

  for (const g of GROUPS) {
    if (!all[g] || !Object.keys(all[g]).length) problems.push(`empty group: ${g}`);
  }
  for (const c of (all.cases && all.cases.irac) || []) if (!c.id || !c.input) problems.push(`bad irac case: ${c.id || '?'}`);
  for (const c of (all.cases && all.cases.ask) || []) if (!c.id || !c.input) problems.push(`bad ask case: ${c.id || '?'}`);

  // ASEAN jurisdiction conformance (datasets/asean/schema.json)
  problems.push(...validateAsean(all.asean));

  return { ok: problems.length === 0, problems, counts: counts() };
}

/**
 * Lightweight conformance check for the ASEAN group against
 * datasets/asean/schema.json. Not a full JSON-Schema validator —
 * checks required fields, ISO pattern, trust enum, and the
 * 11-jurisdiction completeness invariant.
 */
function validateAsean(asean) {
  const problems = [];
  const jurisdictions = (asean && asean.jurisdictions) || [];
  const treaties = (asean && asean.treaties) || [];

  const TRUST = new Set(['authoritative', 'secondary', 'uncertain']);
  const ISO_RE = /^[A-Z]{2}$/;
  const REQUIRED = ['id', 'iso', 'name', 'legal_tradition', 'official_language', 'source', 'provenance'];

  const seen = new Set();
  for (const j of jurisdictions) {
    for (const f of REQUIRED) {
      if (j[f] === undefined || j[f] === null || j[f] === '') {
        problems.push(`asean jurisdiction ${j.id || '?'} missing required field "${f}"`);
      }
    }
    if (j.iso && !ISO_RE.test(j.iso)) problems.push(`asean jurisdiction ${j.id || j.iso} iso "${j.iso}" not ^[A-Z]{2}$`);
    if (j.provenance) {
      if (!j.provenance.source) problems.push(`asean jurisdiction ${j.id || '?'} provenance.source missing`);
      if (!j.provenance.source_url) problems.push(`asean jurisdiction ${j.id || '?'} provenance.source_url missing`);
      if (!j.provenance.retrieved_at) problems.push(`asean jurisdiction ${j.id || '?'} provenance.retrieved_at missing`);
      if (j.provenance.trust && !TRUST.has(j.provenance.trust)) {
        problems.push(`asean jurisdiction ${j.id || '?'} provenance.trust "${j.provenance.trust}" not in [authoritative, secondary, uncertain]`);
      }
    }
    if (typeof j.asean_member !== 'boolean') problems.push(`asean jurisdiction ${j.id || '?'} asean_member must be boolean`);
    if (seen.has(j.iso)) problems.push(`asean jurisdiction duplicate iso "${j.iso}"`);
    else if (j.iso) seen.add(j.iso);
  }

  // Completeness invariant: all 11 ASEAN member states must be present and members.
  const EXPECTED = ['BN', 'KH', 'ID', 'LA', 'MY', 'MM', 'PH', 'SG', 'TH', 'VN', 'TL'];
  for (const iso of EXPECTED) {
    if (!seen.has(iso)) problems.push(`asean jurisdictions missing member "${iso}"`);
  }
  for (const j of jurisdictions) {
    if (EXPECTED.includes(j.iso) && j.asean_member !== true) {
      problems.push(`asean jurisdiction ${j.iso} is a member state but asean_member !== true`);
    }
  }

  for (const t of treaties) {
    if (!t.id) problems.push('asean treaty missing id');
    if (!t.title) problems.push(`asean treaty ${t.id || '?'} missing title`);
    if (t.provenance && t.provenance.trust && !TRUST.has(t.provenance.trust)) {
      problems.push(`asean treaty ${t.id} provenance.trust "${t.provenance.trust}" invalid`);
    }
  }

  return problems;
}
