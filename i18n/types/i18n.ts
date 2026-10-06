// i18n/types/i18n.ts

import type { Locale as LocaleCode } from "@/i18n/config/locales";

// ─────────────────────────────────────────────────────────────
// Re-export the canonical Locale union from config.
// This is the single source of truth — never redefine it here.
// ─────────────────────────────────────────────────────────────
export type Locale = LocaleCode;

// ─────────────────────────────────────────────────────────────
// Message shapes
// ─────────────────────────────────────────────────────────────
/** A leaf value inside a message bundle. */
export type MessageValue = string;

/** Nested message tree — `{ documents: { title: "Documents" } }` */
export interface MessageTree {
  [key: string]: MessageValue | MessageTree;
}

/**
 * Full dictionary for a single locale.
 * Loose by design — the JSON imports are typed via `unknown` in
 * `i18n/messages/index.ts` and merged at runtime.
 */
export interface Messages {
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────
// Runtime config
// ─────────────────────────────────────────────────────────────
export interface I18nConfig {
  locale: Locale;
  messages: Messages;
  defaultLocale: Locale;
  fallbackLocale: Locale;
}

// ─────────────────────────────────────────────────────────────
// Translation API
// ─────────────────────────────────────────────────────────────
/** Values that can be interpolated into `{{placeholder}}` tokens. */
export type InterpolationValue = string | number | boolean | null | undefined;

export interface TranslationOptions {
  /** `{{name}}`-style substitutions */
  interpolation?: Record<string, InterpolationValue>;
  /** Pluralisation count — picks singular vs plural form */
  count?: number;
  /** Date to format using the active locale */
  date?: Date | string | number;
  /** Number to format using the active locale */
  number?: number;
  /** ISO 4217 code — pairs with `number` to render a currency value */
  currency?: string;
}

// ─────────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────────
export type DateInput = Date | string | number;

export interface I18nFormatters {
  date: (v: DateInput) => string;
  dateLong: (v: DateInput) => string;
  dateTime: (v: DateInput) => string;
  time: (v: DateInput) => string;
  relative: (v: DateInput) => string;
  number: (v: number) => string;
  percent: (v: number) => string;
  compact: (v: number) => string;
  currency: (v: number, currency?: string) => string;
}

// ─────────────────────────────────────────────────────────────
// Public context value — matches i18n/hooks/use-i18n.tsx
// ─────────────────────────────────────────────────────────────
export interface I18nContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  messages: Messages;

  /** Resolve a dotted key with optional interpolation. */
  t: (key: string, vars?: Record<string, InterpolationValue>) => string;

  /** Resolve a raw object/array at a dotted key. */
  raw: <T = unknown>(key: string) => T;

  /** Locale-aware formatters. */
  formatDate: I18nFormatters["date"];
  formatDateTime: I18nFormatters["dateTime"];
  formatTime: I18nFormatters["time"];
  formatRelative: I18nFormatters["relative"];
  formatNumber: I18nFormatters["number"];
  formatPercent: I18nFormatters["percent"];
  formatCompact: I18nFormatters["compact"];
  formatCurrency: I18nFormatters["currency"];

  /** Bundled formatters — handy for passing into non-React code. */
  format: I18nFormatters;

  /** Pluralise using `{{n}}` interpolation. */
  plural: (
    count: number,
    singular: string,
    pluralForm: string,
    vars?: Record<string, InterpolationValue>,
  ) => string;

  /** Switch locale — writes the cookie and reloads. */
  setLocale: (next: Locale) => void;
}

// ─────────────────────────────────────────────────────────────
// Provider props
// ─────────────────────────────────────────────────────────────
export interface I18nProviderProps {
  children: React.ReactNode;
  locale: Locale;
  /** Server-loaded dictionary for this locale (already merged with fallback) */
  messages: Messages;
  /** Optional fallback dictionary — English by default */
  fallbackMessages?: Messages;
}

// ─────────────────────────────────────────────────────────────
// Namespace registry — mirrors `i18n/messages/en/*.json`
// Adding a new namespace here keeps `useTranslation` type-safe.
// ─────────────────────────────────────────────────────────────
export type Namespace =
  | "common"
  | "nav"
  | "documents"
  | "matters"
  | "contracts"
  | "automation"
  | "hitl"
  | "settings"
  | "auth";

// ─────────────────────────────────────────────────────────────
// Locale metadata (re-export for convenience)
// ─────────────────────────────────────────────────────────────
export type { LocaleMeta } from "@/i18n/config/locales";
