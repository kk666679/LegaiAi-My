'use strict';

/**
 * export — render an IRAC analysis into 5 delivery formats.
 *
 * Formats: irac (markdown), memo (markdown), json, html, citations (list).
 * Every format derives from the same normalised payload so the citation
 * numbering is identical across all of them — a `[1]` in the HTML must be the
 * same authority as `[1]` in the memo.
 */

const { Translator, detect } = require('../i18n');

const FORMATS = Object.freeze(['irac', 'memo', 'json', 'html', 'citations']);

class UnknownFormatError extends Error {
  constructor(f) {
    super(`Unknown format: ${f}`);
    this.name = 'UnknownFormatError';
    this.code = 'UNKNOWN_FORMAT';
    this.format = f;
  }
}

/** Escape the five characters that break HTML text nodes. */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Normalise `retrieved` into citation records with 1-based `index`.
 * Preserves the raw score rather than rounding it — rounding happens only at
 * render time, so JSON consumers keep full precision.
 */
function citationsOf(retrieved) {
  const list = Array.isArray(retrieved) ? retrieved : [];
  return list.map((r, i) => ({
    index: i + 1,
    id: r && r.id != null ? r.id : null,
    title: r && r.title != null ? r.title : '',
    source: r && r.source != null ? r.source : null,
    url: r && r.url != null ? r.url : null,
    score: r && r.score != null ? r.score : null
  }));
}

function text(v) {
  return v == null ? '' : String(v);
}

function paragraphs(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(text).filter(Boolean);
  return String(v).split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
}

function renderIrac(sample, t) {
  const cits = citationsOf(sample.retrieved);
  const lines = [];
  lines.push(`# ${t.t('irac.title', 'en')}`);
  lines.push('');
  lines.push(`## ${t.t('issue.heading', 'en')}`);
  lines.push('');
  for (const p of paragraphs(sample.issue)) lines.push(p);
  lines.push('');
  lines.push(`## ${t.t('rule.heading', 'en')}`);
  lines.push('');
  const rules = Array.isArray(sample.rule) ? sample.rule : paragraphs(sample.rule);
  if (rules.length) {
    for (const r of rules) {
      const id = r && r.id ? `[${r.id}] ` : '';
      lines.push(`- ${id}${text(r && r.text != null ? r.text : r)}`);
    }
  } else {
    lines.push('_No rule identified._');
  }
  lines.push('');
  lines.push(`## ${t.t('application.heading', 'en')}`);
  lines.push('');
  for (const p of paragraphs(sample.application)) lines.push(p);
  lines.push('');
  lines.push(`## ${t.t('conclusion.heading', 'en')}`);
  lines.push('');
  for (const p of paragraphs(sample.conclusion)) lines.push(p);
  lines.push('');
  lines.push(`## ${t.t('citations.heading', 'en')}`);
  lines.push('');
  if (cits.length) {
    for (const c of cits) {
      const score = c.score == null ? '' : ` (score ${(c.score * 100).toFixed(1)}%)`;
      lines.push(`[${c.index}] ${text(c.title)}${c.source ? ` — ${text(c.source)}` : ''}${score}`);
    }
  } else {
    lines.push('_No citations._');
  }
  lines.push('');
  return lines.join('\n');
}

function renderMemo(sample, opts, t) {
  const cits = citationsOf(sample.retrieved);
  const v = sample.validation || {};
  const pct = v.avgConfidence == null ? 'n/a' : `${(v.avgConfidence * 100).toFixed(1)}%`;
  const lines = [];
  lines.push(`**${t.t('memo.to', 'en')}:** ${text(opts.to || '—')}`);
  lines.push('');
  lines.push(`**${t.t('memo.subject', 'en')}:** ${text(opts.subject || '—')}`);
  lines.push('');
  lines.push(`**${t.t('memo.date', 'en')}:** ${text(opts.date || new Date().toISOString())}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## I. Question Presented');
  lines.push('');
  for (const p of paragraphs(sample.issue)) lines.push(p);
  lines.push('');
  lines.push('## II. Short Answer');
  lines.push('');
  for (const p of paragraphs(sample.conclusion)) lines.push(p);
  lines.push('');
  lines.push('## III. Facts');
  lines.push('');
  for (const p of paragraphs(sample.facts)) lines.push(p);
  lines.push('');
  lines.push('## IV. Law');
  lines.push('');
  const rules = Array.isArray(sample.rule) ? sample.rule : paragraphs(sample.rule);
  for (const r of rules) {
    const id = r && r.id ? `[${r.id}] ` : '';
    lines.push(`- ${id}${text(r && r.text != null ? r.text : r)}`);
  }
  if (!rules.length) lines.push('_No rule identified._');
  lines.push('');
  lines.push('## V. Analysis');
  lines.push('');
  for (const p of paragraphs(sample.application)) lines.push(p);
  lines.push('');
  lines.push('## VI. Validation');
  lines.push('');
  lines.push(`- Outcome: ${text(v.outcome || 'n/a')}`);
  if (v.tally) {
    lines.push(`- Tally: yes ${Number(v.tally.yes) || 0}, no ${Number(v.tally.no) || 0}, abstain ${Number(v.tally.abstain) || 0}`);
  }
  lines.push(`- Average confidence: ${pct}`);
  lines.push('');
  lines.push('## Citations');
  lines.push('');
  for (const c of cits) lines.push(`${c.index}. ${text(c.title)}${c.source ? ` — ${text(c.source)}` : ''}`);
  lines.push('');
  return lines.join('\n');
}

function renderHtml(sample, t) {
  const cits = citationsOf(sample.retrieved);
  const parts = [];
  parts.push('<article>');
  parts.push(`<h1>${esc(t.t('irac.title', 'en'))}</h1>`);
  parts.push(`<h2>${esc(t.t('issue.heading', 'en'))}</h2>`);
  for (const p of paragraphs(sample.issue)) parts.push(`<p>${esc(p)}</p>`);
  parts.push(`<h2>${esc(t.t('rule.heading', 'en'))}</h2>`);
  const rules = Array.isArray(sample.rule) ? sample.rule : [];
  if (rules.length) {
    parts.push('<ul>');
    for (const r of rules) {
      const body = text(r && r.text != null ? r.text : r);
      parts.push(`<li>${r && r.id ? `<a href="#cite-${esc(r.id)}">[${esc(r.id)}]</a> ` : ''}${esc(body)}</li>`);
    }
    parts.push('</ul>');
  }
  parts.push(`<h2>${esc(t.t('application.heading', 'en'))}</h2>`);
  for (const p of paragraphs(sample.application)) parts.push(`<p>${esc(p)}</p>`);
  parts.push(`<h2>${esc(t.t('conclusion.heading', 'en'))}</h2>`);
  for (const p of paragraphs(sample.conclusion)) parts.push(`<p>${esc(p)}</p>`);
  parts.push(`<h2>${esc(t.t('citations.heading', 'en'))}</h2>`);
  parts.push('<ol>');
  for (const c of cits) {
    parts.push(`<li id="cite-${c.index}">${esc(c.title)}${c.source ? ` — ${esc(c.source)}` : ''}</li>`);
  }
  parts.push('</ol>');
  parts.push('</article>');
  return parts.join('\n');
}

function renderJson(sample) {
  return JSON.stringify({
    issue: text(sample.issue),
    rule: Array.isArray(sample.rule) ? sample.rule : paragraphs(sample.rule),
    application: text(sample.application),
    conclusion: text(sample.conclusion),
    retrieved: citationsOf(sample.retrieved),
    validation: sample.validation || null
  }, null, 2);
}

function renderCitations(sample, t) {
  const cits = citationsOf(sample.retrieved);
  if (!cits.length) return `_${t.t('citations.heading', 'en')}: none._`;
  return cits
    .map(c => `[${c.index}] ${text(c.title)}${c.source ? ` — ${text(c.source)}` : ''}`)
    .join('\n');
}

const RENDERERS = {
  irac: (s, _o, t) => renderIrac(s, t),
  memo: (s, o, t) => renderMemo(s, o || {}, t),
  json: s => renderJson(s),
  html: (s, _o, t) => renderHtml(s, t),
  citations: (s, _o, t) => renderCitations(s, t)
};

const MIMES = {
  irac: 'text/markdown',
  memo: 'text/markdown',
  json: 'application/json',
  html: 'text/html',
  citations: 'text/plain'
};

/** Render one format. Throws UnknownFormatError for anything unregistered. */
function format(sample, name, opts = {}) {
  const fn = RENDERERS[name];
  if (!fn) throw new UnknownFormatError(name);
  const t = opts.translator || new Translator();
  return fn(sample || {}, opts, t);
}

/** Render every format. Keys are the format names. */
function renderAll(sample, opts = {}) {
  const out = {};
  for (const f of FORMATS) {
    out[f] = { format: f, mime: MIMES[f], text: format(sample, f, opts) };
  }
  return out;
}

function keyFor() {
  return 'irac.title';
}

const REF_RE = /\[([A-Za-z][A-Za-z0-9_.:-]{0,63})\]/g;

/** Extract bracketed reference tokens, e.g. `[R1]`, `[X9]`. Deduplicated. */
function extractRefs(s) {
  const out = new Set();
  const str = String(s == null ? '' : s);
  let m;
  REF_RE.lastIndex = 0;
  while ((m = REF_RE.exec(str)) !== null) out.add(m[1]);
  return out;
}

/**
 * Split refs into those present in `pool` and those absent. `pool` may be an
 * array of objects with `id`, or an array of bare id strings.
 */
function resolveRefs(refs, pool) {
  const ids = new Set();
  for (const p of Array.isArray(pool) ? pool : []) {
    if (p == null) continue;
    ids.add(typeof p === 'object' ? String(p.id) : String(p));
  }
  const resolved = [];
  const unresolved = [];
  for (const r of refs || []) {
    (ids.has(String(r)) ? resolved : unresolved).push(String(r));
  }
  return { resolved, unresolved };
}

module.exports = {
  FORMATS,
  MIMES,
  UnknownFormatError,
  format,
  renderAll,
  citationsOf,
  extractRefs,
  resolveRefs,
  esc
};