/**
 * i18n — shared catalogue loader and language detection.
 *
 * The catalogue lives in `i18n/messages/<locale>/analysis.json` at
 * the repo root — one source of truth shared with the Next.js
 * frontend. This module flattens that namespace into the
 * dotted-key catalogue the drafting and validation paths expect,
 * starting from the English strings and overlaying whatever the
 * locale file translates. Locales without a file simply keep the
 * English strings, so the catalogue can never regress to gaps.
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MESSAGES_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "i18n",
  "messages",
);

/** Flatten a nested object into dotted keys: `{ a: { b: "c" } }` → `{ "a.b": "c" }`. */
function flatten(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flatten(value, path));
    } else if (typeof value === "string") {
      out[path] = value;
    }
  }
  return out;
}

function loadNamespace(locale, namespace) {
  try {
    return JSON.parse(
      readFileSync(join(MESSAGES_ROOT, locale, `${namespace}.json`), "utf8"),
    );
  } catch {
    return {};
  }
}

/** Locales that ship their own analysis catalogue. */
const TRANSLATED = (() => {
  try {
    return readdirSync(MESSAGES_ROOT).filter((dir) => {
      try {
        readFileSync(join(MESSAGES_ROOT, dir, "analysis.json"), "utf8");
        return true;
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
})();

const EN_CATALOG = flatten(loadNamespace("en", "analysis"));

/**
 * Dotted-key catalogue per language. Every locale starts from the
 * English strings; a locale file overlays its own translations.
 */
const CATALOG = Object.freeze(
  Object.fromEntries(
    TRANSLATED.map((locale) => [
      locale,
      Object.freeze({
        ...EN_CATALOG,
        ...flatten(loadNamespace(locale, "analysis")),
      }),
    ]),
  ),
);

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

export { CATALOG, LANGS, Translator, detect, normalise };
