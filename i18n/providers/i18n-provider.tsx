"use client";
// i18n/providers/i18n-provider.tsx
import * as React from "react";
import { I18nContext, type I18nContextValue } from "@/i18n/hooks/use-i18n";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  localeDirections,
  localeMeta,
  type Locale,
} from "@/i18n/config/locales";
import {
  createFormatters,
  interpolate,
  plural as pluralize,
  resolvePath,
} from "@/i18n/utils/translation-utils";

export interface I18nProviderProps {
  children: React.ReactNode;
  locale: Locale;
  /** Server-loaded dictionary for this locale (already merged with fallback) */
  messages: Record<string, unknown>;
  /** Optional fallback dictionary — English by default */
  fallbackMessages?: Record<string, unknown>;
}

export function I18nProvider({
  children,
  locale: initialLocale,
  messages,
  fallbackMessages,
}: I18nProviderProps) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);

  React.useEffect(() => setLocaleState(initialLocale), [initialLocale]);

  // Keep <html lang dir> in sync with the active locale
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirections[locale];
  }, [locale]);

  const t = React.useCallback(
    (key: string, vars?: Record<string, unknown>, defaultValue?: string): string => {
      const value = resolvePath(messages, key);
      if (typeof value === "string") return interpolate(value, vars);
      if (fallbackMessages) {
        const fb = resolvePath(fallbackMessages, key);
        if (typeof fb === "string") return interpolate(fb, vars);
      }
      // Caller-supplied fallback — used for dynamic keys
      // (e.g. navigation labels driven by data).
      if (defaultValue !== undefined) return interpolate(defaultValue, vars);
      // Visible placeholder in dev so misses are easy to spot
      if (process.env.NODE_ENV !== "production") return `⟨${key}⟩`;
      return "";
    },
    [messages, fallbackMessages],
  );

  const raw = React.useCallback(
    <T,>(key: string): T => resolvePath(messages, key) as T,
    [messages],
  );

  const format = React.useMemo(
    () => createFormatters(localeMeta(locale).intlCode),
    [locale],
  );

  const plural = React.useCallback(
    (count: number, singular: string, pluralForm: string, vars?: Record<string, unknown>) => {
      // If the tokens are dictionary keys, translate them; otherwise use raw strings.
      const one = singular.includes(".") ? t(singular, { ...vars, n: count, count }) : singular;
      const other = pluralForm.includes(".") ? t(pluralForm, { ...vars, n: count, count }) : pluralForm;
      return pluralize(count, one, other, { ...vars, n: count, count });
    },
    [t],
  );

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof document === "undefined") return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Full reload so server components re-render with the new dictionary
    window.location.reload();
  }, []);

  const value = React.useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: localeDirections[locale],
      messages,
      t,
      raw,
      formatDate: format.date,
      formatDateTime: format.dateTime,
      formatTime: format.time,
      formatRelative: format.relative,
      formatNumber: format.number,
      formatPercent: format.percent,
      formatCompact: format.compact,
      formatCurrency: format.currency,
      plural,
      format,
      setLocale,
    }),
    [locale, messages, t, raw, format, plural, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export { DEFAULT_LOCALE };
