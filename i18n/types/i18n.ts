export type Locale = 'en' | 'ms';

export interface Messages {
  [key: string]: any;
}

export interface I18nConfig {
  locale: Locale;
  messages: Messages;
  defaultLocale: Locale;
  fallbackLocale: Locale;
}

export interface TranslationOptions {
  interpolation?: Record<string, any>;
  count?: number;
  date?: Date;
  number?: number;
  currency?: string;
}
