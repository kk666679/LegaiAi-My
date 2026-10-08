import en from "./locales/en.json";
import ms from "./locales/ms.json";
import id from "./locales/id.json";
import th from "./locales/th.json";
import vi from "./locales/vi.json";
import tl from "./locales/tl.json";
import my from "./locales/my.json";
import km from "./locales/km.json";
import lo from "./locales/lo.json";

export const SUPPORTED_LOCALES = [
  "en",
  "ms",
  "id",
  "th",
  "vi",
  "tl",
  "my",
  "km",
  "lo",
] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ms: "Bahasa Melayu",
  id: "Bahasa Indonesia",
  th: "ไทย",
  vi: "Tiếng Việt",
  tl: "Filipino",
  my: "မြန်မာ",
  km: "ខ្មែរ",
  lo: "ລາວ",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  ms: "🇲🇾",
  id: "🇮🇩",
  th: "🇹🇭",
  vi: "🇻🇳",
  tl: "🇵🇭",
  my: "🇲🇲",
  km: "🇰🇭",
  lo: "🇱🇦",
};

export const LOCALE_COUNTRY: Record<Locale, string> = {
  en: "International",
  ms: "Malaysia / Brunei",
  id: "Indonesia",
  th: "Thailand",
  vi: "Vietnam",
  tl: "Philippines",
  my: "Myanmar",
  km: "Cambodia",
  lo: "Laos",
};

export const RESOURCES = {
  en,
  ms,
  id,
  th,
  vi,
  tl,
  my,
  km,
  lo,
} as const;

export type TranslationDictionary = typeof en;
