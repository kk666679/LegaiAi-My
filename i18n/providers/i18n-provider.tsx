"use client";

import { I18nContext } from '@/i18n/hooks/use-i18n';
import type { Locale } from '@/i18n/config/locales';
import React from 'react';

export { I18nContext };

export function I18nProvider({ children, locale, messages }: {
  children: React.ReactNode;
  locale: Locale;
  messages: Record<string, unknown>;
}) {
  return (
    <I18nContext.Provider value={{ locale, messages, t: (key) => key, formatDate: (date) => date.toISOString(), formatNumber: (value) => `${value}`, formatCurrency: (value) => `${value}`, plural: (count, singular, plural) => (count === 1 ? singular : plural) }}>
      {children}
    </I18nContext.Provider>
  );
}
