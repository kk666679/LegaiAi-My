import { DEFAULT_LOCALE, type Locale } from "../config/locales";
import { deepMerge } from "../utils/translation-utils";

// ── English source of truth ────────────────────────────────────
import enAuth from "./en/auth.json";

// ── All other locales (merged over English at load time) ───────
import msAuth from "./ms/auth.json"; // Bahasa Malaysia
import idAuth from "./id/auth.json"; // Bahasa Indonesia
import thAuth from "./th/auth.json"; // ไทย
import viAuth from "./vi/auth.json"; // Tiếng Việt
import tlAuth from "./tl/auth.json"; // Tagalog
import kmAuth from "./km/auth.json"; // ខ្មែរ
import loAuth from "./lo/auth.json"; // ລາວ
import myAuth from "./my/auth.json"; // မြန်မာ
import bnAuth from "./bn/auth.json"; // বাংলা
import jvAuth from "./jv/auth.json"; // Basa Jawa

// Cast JSON imports — TS infers narrow literal types otherwise.
const en = enAuth as unknown as Record<string, unknown>;

const merge = (override: Record<string, unknown>) => deepMerge(en, override);

/**
 * Every locale's full message tree.
 * Non-English locales are deep-merged over English so any missing
 * key silently falls through to the English string — no runtime gaps.
 */
export const BUNDLES: Record<Locale, Record<string, unknown>> = {
  en,
  ms: merge(msAuth as unknown as Record<string, unknown>),
  id: merge(idAuth as unknown as Record<string, unknown>),
  th: merge(thAuth as unknown as Record<string, unknown>),
  vi: merge(viAuth as unknown as Record<string, unknown>),
  tl: merge(tlAuth as unknown as Record<string, unknown>),
  km: merge(kmAuth as unknown as Record<string, unknown>),
  lo: merge(loAuth as unknown as Record<string, unknown>),
  my: merge(myAuth as unknown as Record<string, unknown>),
  bn: merge(bnAuth as unknown as Record<string, unknown>),
  jv: merge(jvAuth as unknown as Record<string, unknown>),
};

/** Load a locale's full message tree. Falls through to English. */
export function loadMessages(locale: Locale): Record<string, unknown> {
  return BUNDLES[locale] ?? BUNDLES[DEFAULT_LOCALE];
}

/** Raw English dictionary — used as the fallback in the provider. */
export function getFallbackMessages(): Record<string, unknown> {
  return BUNDLES[DEFAULT_LOCALE];
}

/** All locales that currently have a message bundle. */
export function availableLocales(): Locale[] {
  return Object.keys(BUNDLES) as Locale[];
}
