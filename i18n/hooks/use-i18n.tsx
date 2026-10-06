"use client";
// i18n/hooks/use-i18n.tsx
import * as React from "react";
import type { Locale } from "../config/locales";
import type { Formatters } from "../utils/translation-utils";

export interface I18nContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  messages: Record<string, unknown>;
  /** Translate a fully-qualified dotted key. */
  t: (key: string, vars?: Record<string, unknown>) => string;
  /** Fetch the raw value (object/array) at a dotted key. */
  raw: <T = unknown>(key: string) => T;
  formatDate: (v: string | number | Date) => string;
  formatDateTime: (v: string | number | Date) => string;
  formatTime: (v: string | number | Date) => string;
  formatRelative: (v: string | number | Date) => string;
  formatNumber: (v: number) => string;
  formatPercent: (v: number) => string;
  formatCompact: (v: number) => string;
  formatCurrency: (v: number, currency?: string) => string;
  plural: (count: number, singular: string, pluralForm: string, vars?: Record<string, unknown>) => string;
  /** All formatters bundled — handy for passing around. */
  format: Formatters;
  setLocale: (next: Locale) => void;
}

export const I18nContext = React.createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>.");
  return ctx;
}
