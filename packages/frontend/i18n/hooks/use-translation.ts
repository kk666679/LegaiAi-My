"use client";
// i18n/hooks/use-translation.ts
import { useI18n } from "./use-i18n";

export function useTranslation(namespace: string = "common") {
  const i18n = useI18n();
  const { t: baseT, exists: baseExists } = i18n;

  const t = (
    key: string,
    vars?: Record<string, unknown> | { defaultValue?: string },
  ) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    // Back-compat with the legacy lib/i18n signature:
    // t(key, { defaultValue: "Fallback" }) returns the fallback when missing.
    if (
      vars &&
      typeof vars === "object" &&
      "defaultValue" in vars &&
      !baseExists(fullKey)
    ) {
      const { defaultValue, ...rest } = vars as Record<string, unknown> & {
        defaultValue?: string;
      };
      if (typeof defaultValue === "string") {
        if (Object.keys(rest).length === 0) return defaultValue;
        // Interpolate the fallback itself when extra vars are present.
        return defaultValue.replace(/\{\{(\w+)\}\}/g, (_, k) =>
          rest[k] === undefined || rest[k] === null ? "" : String(rest[k]),
        );
      }
    }
    return baseT(fullKey, vars as Record<string, unknown> | undefined);
  };

  const exists = (key: string) =>
    baseExists(namespace ? `${namespace}.${key}` : key);

  return {
    ...i18n,
    /** Namespace-scoped translate — `t('title')` → `auth.title` */
    t,
    exists,
    /** Escape hatch for cross-namespace lookups */
    tGlobal: baseT,
  };
}
