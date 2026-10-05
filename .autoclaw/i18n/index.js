'use strict';

/**
 * i18n — EN/MS catalogue and language detection.
 *
 * Scope is deliberately narrow: a flat key/value catalogue per language plus
 * a marker-word detector. It is not a translation engine — it resolves
 * scaffolding headings and fixed phrases, which is all the drafting and
 * validation paths need.
 */

const CATALOG = Object.freeze({
  en: Object.freeze({
    'conclusion.heading': 'Conclusion',
    'issue.heading': 'Issue',
    'rule.heading': 'Rule',
    'application.heading': 'Application',
    'citations.heading': 'Citations',
    'validation.heading': 'Validation',
    'insufficient.evidence': 'Insufficient verified evidence.',
    'irac.title': 'IRAC Analysis',
    'memo.to': 'To',
    'memo.subject': 'Subject',
    'memo.date': 'Date',
    'memo.re': 'Re'
  }),
  ms: Object.freeze({
    'conclusion.heading': 'Kesimpulan',
    'issue.heading': 'Isu',
    'rule.heading': 'Undang-undang',
    'application.heading': 'Pentulahan',
    'citations.heading': 'Rujukan',
    'validation.heading': 'Pengesahan',
    'insufficient.evidence': 'Bukti terverifikasi yang mencukupi tidak tersedia.',
    'irac.title': 'Analisis IRAC',
    'memo.to': 'Kepada',
    'memo.subject': 'Perihal',
    'memo.date': 'Tarikh',
    'memo.re': 'Rujukan'
  })
});

const LANGS = Object.freeze(Object.keys(CATALOG));

// Marker words are deliberately function-word heavy: they are frequent in
// Malay legal prose and near-absent from English legal prose, which keeps the
// detector stable on short strings.
const MS_MARKERS = Object.freeze([
  'mahkamah', 'telah', 'bahawa', 'adalah', 'yang', 'dan', 'untuk', 'dengan',
  'mana', 'sebagai', 'tidak', 'boleh', 'mengikut', 'peruntukan', 'seksyen',
  'akta', 'undang-undang', 'memandangkan', 'justeru', 'denda', 'hak',
  'kewajiban', 'golongan', 'keutamaan', 'isu', 'mengenai', 'terhadap',
  'menerangkan', 'menyatakan'
]);

const EN_MARKERS = Object.freeze([
  'the', 'and', 'of', 'court', 'held', 'that', 'shall', 'section', 'act',
  'whereas', 'hereby', 'plaintiff', 'defendant', 'witness', 'affirmed'
]);

function normalise(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function score(text, markers) {
  if (!text) return 0;
  let n = 0;
  for (const m of markers) {
    // Word-boundary match so 'act' does not fire inside 'character'.
    if (new RegExp(`(?:^|\\s)${m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\s)`).test(text)) n++;
  }
  return n;
}

/**
 * Detect language. Returns 'en' for empty or ambiguous input — English is
 * the default drafting language, so an inconclusive detect must not silently
 * emit Malay scaffolding.
 */
function detect(text) {
  const t = normalise(text);
  if (!t) return 'en';
  const ms = score(t, MS_MARKERS);
  const en = score(t, EN_MARKERS);
  if (ms === 0 && en === 0) return 'en';
  return ms > en ? 'ms' : 'en';
}

class Translator {
  constructor({ catalog = CATALOG, defaultLang = 'en' } = {}) {
    this.catalog = catalog;
    this.defaultLang = defaultLang;
  }

  /** Resolve `key` for `lang`, falling back to the key itself when absent. */
  t(key, lang = this.defaultLang) {
    const table = this.catalog[lang] || this.catalog[this.defaultLang] || {};
    const v = table[key];
    return v == null ? key : v;
  }

  /** Resolve `key` using the language detected from `text`. */
  auto(key, text) {
    return this.t(key, detect(text));
  }

  has(key, lang = this.defaultLang) {
    const table = this.catalog[lang] || {};
    return table[key] != null;
  }
}

module.exports = { CATALOG, LANGS, Translator, detect, normalise };