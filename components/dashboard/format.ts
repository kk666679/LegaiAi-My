/**
 * Presentation-only formatters shared by dashboard components.
 *
 * Every function is total: it accepts possibly-undefined input and always
 * returns a string, so components never have to guard their own formatting.
 * All of them are safe to call during server rendering — `formatRelativeTime`
 * additionally accepts an explicit `now` to keep snapshots deterministic.
 */

const numberFormatter = new Intl.NumberFormat("en-MY");

/** `12345` → `"12,345"`. Non-finite input → `"0"`. */
export function formatNumber(value: number | undefined | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "0";
  return numberFormatter.format(value);
}

/** Clamp to `0..100`, returning 0 for anything non-finite. */
export function toPercent(value: number | undefined | null): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 100) return 100;
  return value;
}

/** `0.734` → `"73%"`. Input is a `0..1` fraction, as used across dashboard types. */
export function formatPercent(fraction: number | undefined | null, digits = 0): string {
  return `${toPercent((fraction ?? 0) * 100).toFixed(digits)}%`;
}

/** Percentage of `value` out of `total`, clamped to `0..100`. */
export function percentOf(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return toPercent((value / total) * 100);
}

/** `1250` → `"1,250 credits"`. */
export function formatCredits(value: number | undefined | null, noun = "credits"): string {
  return `${formatNumber(value)} ${noun}`;
}

/** Monetary value using `en-MY` conventions. Non-finite input → `"—"`. */
export function formatMoney(
  value: number | undefined | null,
  currency = "MYR",
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${formatNumber(value)}`;
  }
}

/** ISO date only — `"12 Mar 2026"`. Invalid/missing → `"—"`. */
export function formatDate(iso: string | undefined | null): string {
  const date = toDate(iso);
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** ISO date and time — `"12 Mar 2026, 14:03"`. Invalid/missing → `"—"`. */
export function formatDateTime(iso: string | undefined | null): string {
  const date = toDate(iso);
  if (!date) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * `"just now"` / `"12m ago"` / `"3d ago"` / falls back to an absolute date
 * beyond a week. Pass `now` to keep rendered output stable in tests.
 */
export function formatRelativeTime(
  iso: string | undefined | null,
  now: number = Date.now(),
): string {
  const date = toDate(iso);
  if (!date) return "—";
  const seconds = Math.round((now - date.getTime()) / 1000);
  if (seconds < 0) return "just now";
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  const days = Math.floor(seconds / 86400);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** `950` → `"950ms"`, `3400` → `"3.4s"`, `92000` → `"1m 32s"`. */
export function formatDuration(ms: number | undefined | null): string {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const restSeconds = Math.round(seconds % 60);
  return `${minutes}m ${restSeconds}s`;
}

/** Approximate word count, used when the backend does not supply one. */
export function countWords(text: string | undefined | null): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** `undefined` → `"Insufficient verified evidence."` — the project fallback string. */
export const INSUFFICIENT_EVIDENCE = "Insufficient verified evidence.";

/** Accessibility-friendly join: `"a, b and c"`. */
export function formatList(
  items: readonly string[],
  conjunction = "and",
): string {
  const clean = items.filter((item) => item.trim().length > 0);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0] ?? "";
  return `${clean.slice(0, -1).join(", ")} ${conjunction} ${clean[clean.length - 1]}`;
}

/**
 * Safe external-link props. Legal sources are frequently third-party, so
 * every outbound link gets `rel="noreferrer noopener"`.
 */
export const externalLinkProps = {
  target: "_blank",
  rel: "noreferrer noopener",
} as const;

/** Stable DOM id for a source card anchor, used by inline citation links. */
export function sourceAnchorId(sourceId: string): string {
  return `dashboard-source-${sourceId}`;
}

function toDate(iso: string | undefined | null): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}