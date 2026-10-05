"use client";

import { useI18n } from './use-i18n';

export function useTranslation(namespace: string = 'common') {
  const { messages, t } = useI18n();

  const translate = (key: string, interpolation?: Record<string, unknown>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return t(fullKey, interpolation);
  };

  return { t: translate, messages };
}
