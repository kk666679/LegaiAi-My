// i18n/config/locales.ts

// ─────────────────────────────────────────────────────────────
// Locale union — mirrors i18n/messages/* folders exactly
// ─────────────────────────────────────────────────────────────
export type Locale =
  | "en" // English
  | "ms" // Bahasa Malaysia
  | "id" // Bahasa Indonesia
  | "th" // ไทย
  | "vi" // Tiếng Việt
  | "tl" // Tagalog
  | "km" // ខ្មែរ
  | "lo" // ລາວ
  | "my" // မြန်မာ
  | "bn" // বাংলা
  | "jv"; // Basa Jawa

// ─────────────────────────────────────────────────────────────
// Locale list + default
// ─────────────────────────────────────────────────────────────
export const locales: Locale[] = [
  "en",
  "ms",
  "id",
  "th",
  "vi",
  "tl",
  "km",
  "lo",
  "my",
  "bn",
  "jv",
];

export const defaultLocale: Locale = "en";
export const DEFAULT_LOCALE: Locale = defaultLocale;

// ─────────────────────────────────────────────────────────────
// Display names (endonym — the language's own name)
// ─────────────────────────────────────────────────────────────
export const localeNames: Record<Locale, string> = {
  en: "English",
  ms: "Bahasa Malaysia",
  id: "Bahasa Indonesia",
  th: "ไทย",
  vi: "Tiếng Việt",
  tl: "Tagalog",
  km: "ខ្មែរ",
  lo: "ລາວ",
  my: "မြန်မာ",
  bn: "বাংলা",
  jv: "Basa Jawa",
};

// ─────────────────────────────────────────────────────────────
// Text direction
// ─────────────────────────────────────────────────────────────
export const localeDirections: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ms: "ltr",
  id: "ltr",
  th: "ltr",
  vi: "ltr",
  tl: "ltr",
  km: "ltr",
  lo: "ltr",
  my: "ltr",
  bn: "ltr",
  jv: "ltr",
};

// ─────────────────────────────────────────────────────────────
// Cookie + storage
// ─────────────────────────────────────────────────────────────
export const messagesPath = "/messages";
export const LOCALE_COOKIE = "lawmate_locale";

// ─────────────────────────────────────────────────────────────
// Extended metadata — flags, Intl codes, readiness
// ─────────────────────────────────────────────────────────────
export interface LocaleMeta {
  code: Locale;
  /** Endonym — the language's own name */
  name: string;
  /** English name */
  englishName: string;
  flag: string;
  /** BCP-47 tag for Intl.* formatters */
  intlCode: string;
  /** Default region for dates / currency */
  region: string;
  /** Fully translated?  false → falls through to English */
  ready: boolean;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { code: "en", name: "English",          englishName: "English",    flag: "🇬🇧", intlCode: "en-MY",  region: "MY", ready: true  },
  ms: { code: "ms", name: "Bahasa Malaysia",  englishName: "Malay",      flag: "🇲🇾", intlCode: "ms-MY",  region: "MY", ready: true  },
  id: { code: "id", name: "Bahasa Indonesia", englishName: "Indonesian", flag: "🇮🇩", intlCode: "id-ID",  region: "ID", ready: false },
  th: { code: "th", name: "ไทย",              englishName: "Thai",       flag: "🇹🇭", intlCode: "th-TH",  region: "TH", ready: false },
  vi: { code: "vi", name: "Tiếng Việt",       englishName: "Vietnamese", flag: "🇻🇳", intlCode: "vi-VN",  region: "VN", ready: false },
  tl: { code: "tl", name: "Tagalog",          englishName: "Tagalog",    flag: "🇵🇭", intlCode: "fil-PH", region: "PH", ready: false },
  km: { code: "km", name: "ខ្មែរ",               englishName: "Khmer",      flag: "🇰🇭", intlCode: "km-KH",  region: "KH", ready: false },
  lo: { code: "lo", name: "ລາວ",               englishName: "Lao",        flag: "🇱🇦", intlCode: "lo-LA",  region: "LA", ready: false },
  my: { code: "my", name: "မြန်မာ",             englishName: "Burmese",    flag: "🇲🇲", intlCode: "my-MM",  region: "MM", ready: false },
  bn: { code: "bn", name: "বাংলা",             englishName: "Bengali",    flag: "🇧🇩", intlCode: "bn-BD",  region: "BD", ready: false },
  jv: { code: "jv", name: "Basa Jawa",        englishName: "Javanese",   flag: "🇮🇩", intlCode: "jv-ID",  region: "ID", ready: false },
};

export function localeMeta(locale: Locale): LocaleMeta {
  return LOCALE_META[locale] ?? LOCALE_META[defaultLocale];
}

// ─────────────────────────────────────────────────────────────
// Guards + normalisers
// ─────────────────────────────────────────────────────────────
export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function toLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : defaultLocale;
}

// ─────────────────────────────────────────────────────────────
// Accept-Language detection
//   "en-MY,en;q=0.9,ms;q=0.8"  →  "en"
// ─────────────────────────────────────────────────────────────
/**
 * BCP-47 primary tags that map onto a different app locale code.
 * Filipino (`fil`) is served by the Tagalog (`tl`) bundle.
 */
export const LANGUAGE_ALIASES: Record<string, Locale> = {
  fil: "tl",
};

/** Map any BCP-47 tag (e.g. "fil", "fil-PH", "ms-MY") to an app locale. */
export function codeFromIntl(tag: string | null | undefined): Locale | undefined {
  if (!tag) return undefined;
  const lower = tag.trim().toLowerCase();
  if (!lower) return undefined;
  const primary = lower.split("-")[0] ?? lower;
  const aliased = LANGUAGE_ALIASES[primary] ?? LANGUAGE_ALIASES[lower] ?? primary;
  if ((locales as readonly string[]).includes(aliased)) return aliased as Locale;
  // Match by intlCode prefix (e.g. "ms-my" via ms-MY).
  const byIntl = locales.find(
    (l) => LOCALE_META[l].intlCode.toLowerCase() === lower,
  );
  return byIntl;
}
export function detectFromHeader(header: string | null | undefined): Locale {
  if (!header) return defaultLocale;

  const parts = header
    .split(",")
    .map((p) => {
      const [lang, q] = p.trim().split(";");
      const langStr = lang ?? "";
      const quality = q?.startsWith("q=") ? parseFloat(q.slice(2)) : 1;
      return { lang: langStr.trim().toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { lang } of parts) {
    // BCP-47 → app-code aliases (header uses a different primary tag).
    // "fil" (Filipino) is served by the "tl" (Tagalog) bundle.
    const aliased = LANGUAGE_ALIASES[lang] ?? lang;
    // Exact match — "en" / "ms" / "th" / "vi" …
    if (aliased && (locales as readonly string[]).includes(aliased))
      return aliased as Locale;
    // Prefix match — "en-MY" → "en", "zh-Hans" → "zh"
    const base = aliased.split("-")[0];
    if (base) {
      const baseAliased = LANGUAGE_ALIASES[base] ?? base;
      if ((locales as readonly string[]).includes(baseAliased))
        return baseAliased as Locale;
    }
  }

  return defaultLocale;
}

// ─────────────────────────────────────────────────────────────
// Readiness helpers (for the locale switcher)
// ─────────────────────────────────────────────────────────────
export function isReady(locale: Locale): boolean {
  return localeMeta(locale).ready;
}

export function readyLocales(): Locale[] {
  return locales.filter(isReady);
}
