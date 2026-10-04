"use client";

import { useContext } from 'react';
import { I18nContext } from './use-i18n';

export function useTranslation(namespace: string = 'common') {
  const { messages, t } = useContext(I18nContext);
  
  const translate = (key: string, interpolation?: Record<string, any>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const result = t(fullKey, interpolation);
    return result;
  };
  
  return { t: translate, messages };
}
