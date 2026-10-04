export type Locale = 'en' | 'ms';

export const locales: Locale[] = ['en', 'ms'];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ms: 'Bahasa Malaysia'
};

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ms: 'ltr'
};

export const messagesPath = '/messages';
