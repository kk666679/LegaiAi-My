"use client";
// i18n/hooks/use-translation.ts
import { useI18n } from "./use-i18n";

export function useTranslation(namespace: string = "common") {
  const i18n = useI18n();
  const { t: baseT } = i18n;

  const t = (key: string, vars?: Record<string, unknown>) =>
    baseT(namespace ? `${namespace}.${key}` : key, vars);

  return {
    ...i18n,
    /** Namespace-scoped translate — `t('title')` → `auth.title` */
    t,
    /** Escape hatch for cross-namespace lookups */
    tGlobal: baseT,
  };
}
