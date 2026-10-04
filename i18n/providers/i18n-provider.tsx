"use client";

import { I18nContext } from '@/i18n/hooks/use-i18n';
import React from 'react';

export { I18nContext };

export function I18nProvider({ children, locale, messages }: {
  children: React.ReactNode;
  locale: string;
  messages: any;
}) {
  return (
    <I18nContext.Provider value={{ locale, messages }}>
      {children}
    </I18nContext.Provider>
  );
}
