// components/matters/charts/primitives/chart-utils.ts

export const CHART_COLORS = [
  "hsl(217 91% 60%)",
  "hsl(160 84% 39%)",
  "hsl(32 95% 44%)",
  "hsl(340 82% 52%)",
  "hsl(262 83% 58%)",
  "hsl(189 94% 43%)",
  "hsl(20 90% 48%)",
  "hsl(142 71% 45%)",
  "hsl(280 65% 60%)",
  "hsl(199 89% 48%)",
];

export function colorAt(i: number): string {
  const color =
    CHART_COLORS[((i % CHART_COLORS.length) + CHART_COLORS.length) % CHART_COLORS.length];
  if (!color) throw new RangeError(`No chart color exists at index ${i}.`);
  return color;
}

export const STATUS_COLORS: Record<string, string> = {
  intake: "hsl(199 89% 48%)",
  open: "hsl(160 84% 39%)",
  "on-hold": "hsl(32 95% 44%)",
  pending: "hsl(32 95% 44%)",
  review: "hsl(262 83% 58%)",
  billing: "hsl(217 91% 60%)",
  closed: "hsl(220 9% 46%)",
  archived: "hsl(220 9% 46%)",
  cancelled: "hsl(0 84% 60%)",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "hsl(220 9% 60%)",
  normal: "hsl(217 91% 60%)",
  high: "hsl(32 95% 44%)",
  urgent: "hsl(0 84% 60%)",
};

export const INVOICE_COLORS: Record<string, string> = {
  draft: "hsl(220 9% 60%)",
  sent: "hsl(217 91% 60%)",
  paid: "hsl(160 84% 39%)",
  overdue: "hsl(0 84% 60%)",
  void: "hsl(220 9% 46%)",
};

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-MY").format(n);
}

export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function formatCurrency(n: number, currency = "RM"): string {
  return `${currency} ${formatNumber(Math.round(n))}`;
}

export function formatCurrencyCompact(n: number, currency = "RM"): string {
  return `${currency} ${formatCompact(n)}`;
}

export function formatPercent(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

export function formatHours(minutes: number): string {
  return `${(minutes / 60).toFixed(1)} h`;
}

/** Produce ~count nice tick values from 0 to a rounded max. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const rough = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export function maxOf(data: Array<{ values: number[] }>): number {
  let m = 0;
  for (const d of data) for (const v of d.values) if (v > m) m = v;
  return m;
}

export function stackedMaxOf(data: Array<{ values: number[] }>): number {
  let m = 0;
  for (const d of data) {
    const s = sum(d.values);
    if (s > m) m = s;
  }
  return m;
}

/** Smoothing flag: build a linear or catmull-rom path from points. */
export interface Pt { x: number; y: number }

export function linePath(points: Pt[], smooth = true): string {
  if (points.length === 0) return "";
  const first = points[0];
  if (!first) return "";
  if (points.length === 1) return `M ${first.x} ${first.y}`;
  if (!smooth) {
    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  }
  let d = `M ${first.x} ${first.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    if (!p0 || !p1) continue;
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export function areaPath(points: Pt[], baselineY: number, smooth = true): string {
  if (points.length === 0) return "";
  const top = linePath(points, smooth);
  const last = points[points.length - 1];
  const first = points[0];
  if (!last || !first) return "";
  return `${top} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

export function polarPoint(cx: number, cy: number, r: number, angle: number): Pt {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function donutArc(
  cx: number,
  cy: number,
  R: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  const p1 = polarPoint(cx, cy, R, startAngle);
  const p2 = polarPoint(cx, cy, R, endAngle);
  const p3 = polarPoint(cx, cy, r, endAngle);
  const p4 = polarPoint(cx, cy, r, startAngle);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${r} ${r} 0 ${large} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

export function truncateLabel(label: string, max = 12): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/** Colour palette resolution that respects shadcn --chart-N vars if present. */
export function resolveColor(override?: string, fallbackIndex = 0): string {
  if (override) return override;
  if (typeof window !== "undefined") {
    const probe = getComputedStyle(document.documentElement).getPropertyValue("--chart-1");
    if (probe && probe.trim()) {
      return `hsl(var(--chart-${(fallbackIndex % 5) + 1}))`;
    }
  }
  return colorAt(fallbackIndex);
}
