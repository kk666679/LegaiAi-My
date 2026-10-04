export function interpolate(str: string, values: Record<string, any>): string {
  return str.replace(/\{([^{}]*)\}/g, (match, key) => {
    return values[key] !== undefined ? String(values[key]) : match;
  });
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}

export function formatDate(
  date: Date,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return new Date(date).toLocaleString(locale, defaultOptions);
}

export function formatNumber(
  number: number,
  locale: string = 'en',
  options?: Intl.NumberFormatOptions
): string {
  return number.toLocaleString(locale, options);
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en'
): string {
  return amount.toLocaleString(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
