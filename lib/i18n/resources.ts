import en from "./locales/en.json";
import ms from "./locales/ms.json";

export const SUPPORTED_LOCALES = ["en", "ms"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ms: "Bahasa Melayu",
};

export const RESOURCES = {
  en,
  ms,
} as const;

export type TranslationDictionary = typeof en;