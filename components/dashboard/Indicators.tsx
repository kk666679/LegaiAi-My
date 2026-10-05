/**
 * Shared indicator primitives for confidence, relevance and status.
 *
 * Accessibility rules applied throughout:
 * - state is never communicated by colour alone — every indicator renders a
 *   text label (and, where space allows, an icon);
 * - numeric values are exposed through `progressbar` semantics so assistive
 *   technology announces the actual score, not just a filled bar;
 * - a missing score renders as "insufficient" rather than `0%`.
 *
 * No hooks, so these render in server components.
 */

import type { ReactNode } from "react";
import { CheckCircle2, CircleAlert, CircleDashed, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import {
  confidenceLevel,
  type ConfidenceLevel,
  type MetricStatus,
} from "@/components/dashboard/types";
import {
  formatPercent,
  toPercent,
  INSUFFICIENT_EVIDENCE,
} from "@/components/dashboard/format";

const CONFIDENCE_TONES: Record<ConfidenceLevel, string> = {
  high: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-orange-600 dark:text-orange-400",
  insufficient: "text-muted-foreground",
};

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  insufficient: "Insufficient verified evidence",
};

const CONFIDENCE_ICONS: Record<ConfidenceLevel, LucideIcon> = {
  high: CheckCircle2,
  medium: CircleAlert,
  low: CircleAlert,
  insufficient: CircleDashed,
};

export interface ConfidenceIndicatorProps {
  /** `0..1`. Omit when the score is unknown. */
  value?: number | undefined;
  /** Accessible label prefix, e.g. `"Stage confidence"`. */
  label?: string;
  /** Hide the numeric percentage (keeps the word label). */
  hideValue?: boolean;
  /** Hide the progress bar for very dense layouts; the text remains. */
  hideBar?: boolean;
  className?: string;
}

/**
 * Confidence for a metric, stage or artifact.
 *
 * Renders `Insufficient verified evidence.` when no score is supplied,
 * matching the platform's "never present unverified as fact" rule.
 */
export function ConfidenceIndicator({
  value,
  label = "Confidence",
  hideValue = false,
  hideBar = false,
  className,
}: ConfidenceIndicatorProps) {
  const level = confidenceLevel(value);
  const Icon = CONFIDENCE_ICONS[level];
  const percent = value === undefined ? 0 : toPercent(value * 100);
  const text = level === "insufficient" ? INSUFFICIENT_EVIDENCE : CONFIDENCE_LABELS[level];

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Badge
          variant="outline"
          className={cn("gap-1 text-[10px]", CONFIDENCE_TONES[level])}
        >
          <Icon className="size-3" aria-hidden />
          {text}
          {level !== "insufficient" && !hideValue ? ` · ${formatPercent(value)}` : ""}
        </Badge>
      </div>
      {hideBar || level === "insufficient" ? null : (
        <Progress
          value={percent}
          aria-label={`${label}: ${text}, ${Math.round(percent)} percent`}
          className="h-1.5"
        />
      )}
    </div>
  );
}

export interface RelevanceIndicatorProps {
  /** `0..1` relevance of a source to the originating query. */
  value?: number | undefined;
  label?: string;
  className?: string;
}

/**
 * Relevance of a source. Uses a stepped 1–5 band rather than a long bar so
 * the signal stays readable when sources are stacked in a dense list.
 */
export function RelevanceIndicator({
  value,
  label = "Relevance",
  className,
}: RelevanceIndicatorProps) {
  const hasValue = typeof value === "number" && Number.isFinite(value);
  const percent = hasValue ? toPercent(value * 100) : 0;
  const band = hasValue ? Math.max(1, Math.ceil(percent / 20)) : 0;
  const words = ["No score", "Very low", "Low", "Moderate", "High", "Very high"];
  const word = words[band] ?? "No score";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="sr-only">
        {label}: {word}
        {hasValue ? `, ${Math.round(percent)} percent` : ""}
      </span>
      <span
        aria-hidden
        className="flex items-end gap-0.5"
        title={`${label}: ${word}`}
      >
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={cn(
              "w-1 rounded-sm",
              step === 1 ? "h-1.5" : step === 2 ? "h-2" : step === 3 ? "h-2.5" : step === 4 ? "h-3" : "h-3.5",
              step <= band ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </span>
      <span aria-hidden className="text-[11px] text-muted-foreground">
        {hasValue ? formatPercent(value) : "—"}
      </span>
    </span>
  );
}

const METRIC_STATUS_TONES: Record<
  MetricStatus,
  { icon: LucideIcon; className: string; label: string }
> = {
  healthy: {
    icon: CheckCircle2,
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    label: "Healthy",
  },
  warning: {
    icon: CircleAlert,
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    label: "Needs attention",
  },
  error: {
    icon: CircleAlert,
    className: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    label: "Error",
  },
  neutral: {
    icon: HelpCircle,
    className: "border-border bg-muted text-muted-foreground",
    label: "Informational",
  },
};

export interface StatusPillProps {
  status: MetricStatus;
  label?: string;
  className?: string;
}

/** Compact status badge: icon + text, never colour alone. */
export function StatusPill({ status, label, className }: StatusPillProps) {
  const tone = METRIC_STATUS_TONES[status];
  const Icon = tone.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px]", tone.className, className)}>
      <Icon className="size-3" aria-hidden />
      {label ?? tone.label}
    </Badge>
  );
}

/**
 * Small definition row used across metric tiles and summary panels.
 * Keeps label/value semantics consistent instead of ad-hoc `<div>` rows.
 */
export function MetricRow({
  label,
  value,
  hint,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-medium tabular-nums">{value}</dd>
      {hint ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}