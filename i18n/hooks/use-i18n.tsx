"use client";

import { createContext, useContext } from 'react';
import type { Locale } from '@/i18n/config/locales';

export interface Messages {
  [key: string]: any;
}

export interface I18nContextType {
  locale: Locale;
  messages: Messages;
  t: (key: string, interpolation?: Record<string, any>) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (number: number, currency?: string) => string;
  plural: (count: number, singular: string, plural: string) => string;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
