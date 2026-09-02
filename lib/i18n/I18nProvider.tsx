"use client";

import * as React from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  RESOURCES,
  SUPPORTED_LOCALES,
  type Locale,
} from "./resources";

const STORAGE_KEY = "lawmate:locale";

type Dictionary = (typeof RESOURCES)[Locale];

function getByPath(obj: Dictionary, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`,
  );
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (
    key: string,
    vars?: Record<string, string | number>,
    defaultValue?: string,
  ) => string;
  exists: (key: string) => boolean;
  available: readonly Locale[];
  labels: Record<Locale, string>;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

function resolveInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
      return stored as Locale;
    }
  } catch {}
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(DEFAULT_LOCALE);

  React.useEffect(() => {
    setLocaleState(resolveInitialLocale());
  }, []);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
  }, []);

  const value = React.useMemo<I18nContextValue>(() => {
    const dictionary = RESOURCES[locale] as Dictionary;
    const fallback = RESOURCES[DEFAULT_LOCALE] as Dictionary;
    const t: I18nContextValue["t"] = (key, vars, defaultValue) => {
      const primary = getByPath(dictionary, key);
      if (typeof primary === "string") return interpolate(primary, vars);
      const fallbackValue = getByPath(fallback, key);
      if (typeof fallbackValue === "string")
        return interpolate(fallbackValue, vars);
      return defaultValue ?? key;
    };
    const exists: I18nContextValue["exists"] = (key) => {
      const primary = getByPath(dictionary, key);
      const fallbackValue = getByPath(fallback, key);
      return typeof primary === "string" || typeof fallbackValue === "string";
    };
    return {
      locale,
      setLocale,
      t,
      exists,
      available: SUPPORTED_LOCALES,
      labels: LOCALE_LABELS,
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}

export function useTranslation(namespace?: string) {
  const { t, exists, locale, setLocale, available, labels } = useI18n();
  const translate: I18nContextValue["t"] = React.useCallback(
    (key, vars, defaultValue) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return t(fullKey, vars, defaultValue);
    },
    [t, namespace],
  );
  const keyExists = React.useCallback(
    (key: string) => exists(namespace ? `${namespace}.${key}` : key),
    [exists, namespace],
  );
  return { t: translate, exists: keyExists, locale, setLocale, available, labels };
}