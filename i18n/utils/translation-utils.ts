// i18n/utils/translation-utils.ts

/** Walk a nested object by dotted path. Returns undefined if missing. */
export function resolvePath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/** Replace {{placeholder}} tokens. Missing values become empty strings. */
export function interpolate(template: string, vars?: Record<string, unknown>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] === undefined || vars[key] === null ? "" : String(vars[key]),
  );
}

/** Deep merge — used to overlay a locale over the English fallback. */
export function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T> | undefined,
): T {
  if (!override) return base;
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const o = (override as Record<string, unknown>)[key];
    const b = (base as Record<string, unknown>)[key];
    if (b && typeof b === "object" && !Array.isArray(b) && o && typeof o === "object" && !Array.isArray(o)) {
      out[key] = deepMerge(b as Record<string, unknown>, o as Record<string, unknown>);
    } else if (o !== undefined) {
      out[key] = o;
    }
  }
  return out as T;
}

/**
 * Plural picker.
 *   plural(count, "1 item", "{{n}} items", { n: count })
 * Handles English `one/other` semantics using Intl.PluralRules when
 * a 4-arg form is provided: plural(count, one, other, vars)
 */
export function plural(
  count: number,
  singular: string,
  pluralForm: string,
  vars?: Record<string, unknown>,
): string {
  const template = count === 1 ? singular : pluralForm;
  return interpolate(template, { n: count, count, ...vars });
}

/** Locale-aware formatters, constructed once per locale. */
export function createFormatters(locale: string) {
  const dateFmt = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" });
  const dateLongFmt = new Intl.DateTimeFormat(locale, {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });
  const dateTimeFmt = new Intl.DateTimeFormat(locale, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });
  const numberFmt = new Intl.NumberFormat(locale);
  const percentFmt = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const compactFmt = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const relativeFmt = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const toDate = (v: string | number | Date): Date =>
    v instanceof Date ? v : typeof v === "number" ? new Date(v) : new Date(v);

  return {
    date: (v: string | number | Date) => dateFmt.format(toDate(v)),
    dateLong: (v: string | number | Date) => dateLongFmt.format(toDate(v)),
    dateTime: (v: string | number | Date) => dateTimeFmt.format(toDate(v)),
    time: (v: string | number | Date) => timeFmt.format(toDate(v)),
    number: (v: number) => numberFmt.format(v),
    percent: (v: number) => percentFmt.format(v),
    compact: (v: number) => compactFmt.format(v),
    currency: (v: number, currency = "MYR") =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(v),
    relative: (v: string | number | Date) => {
      const then = toDate(v).getTime();
      const diffMs = then - Date.now();
      const sec = Math.round(diffMs / 1000);
      const min = Math.round(sec / 60);
      const hr = Math.round(min / 60);
      const day = Math.round(hr / 24);
      if (Math.abs(sec) < 60) return relativeFmt.format(sec, "second");
      if (Math.abs(min) < 60) return relativeFmt.format(min, "minute");
      if (Math.abs(hr) < 24) return relativeFmt.format(hr, "hour");
      if (Math.abs(day) < 30) return relativeFmt.format(day, "day");
      if (Math.abs(day) < 365) return relativeFmt.format(Math.round(day / 30), "month");
      return relativeFmt.format(Math.round(day / 365), "year");
    },
  };
}

export type Formatters = ReturnType<typeof createFormatters>;
