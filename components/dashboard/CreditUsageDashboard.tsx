"use client";

/**
 * Credit and usage dashboard.
 *
 * Purpose
 * -------
 * One place to answer "how much allocation is left, at what rate am I
 * burning it, and what will happen if I keep going" — with the projection and
 * the warning ladder stated explicitly rather than implied by a coloured bar.
 *
 * Props
 * -----
 * `summary`    `UsageSummary` — allocation, consumption, trend buckets, per
 *              feature breakdown, projection, thresholds. Nothing is derived
 *              from mock data; callers pass real figures.
 * `status`     `DashboardStatus`, resolved through `DashboardStateBoundary`.
 * `onRetry`    Recovery action surfaced only when `status === "error"`.
 * `upgradeHref` / `onNavigateToUpgrade`
 *              Where the low-credit call to action leads. Neither is invented
 *              when absent — the notice simply omits the action.
 *
 * Accessibility
 * -------------
 * The trend chart is `aria-hidden` and mirrored by a visually hidden data
 * table, so the numbers are available to screen readers and to anyone who
 * cannot perceive the plot. Feature usage is rendered as labelled progress
 * rows rather than a pie, which survives small screens and colour blindness.
 * Reduced-motion users get a non-animated plot (see `globals.css`).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowUpRight, Clock, TrendingUp, Zap } from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CREDIT_VALUE_PER_UNIT } from "@/lib/pricing-client";

import {
  DashboardStateBoundary,
  MetricGridSkeleton,
} from "@/components/dashboard/DashboardState";
import { DocumentErrorState } from "@/components/dashboard/DashboardErrorStates";
import { MetricRow } from "@/components/dashboard/Indicators";
import type {
  DashboardStatus,
  UsagePeriod,
  UsagePoint,
  UsageSummary as UsageSummaryType,
} from "@/components/dashboard/types";
import { DEFAULT_USAGE_THRESHOLDS } from "@/components/dashboard/types";
import {
  formatCredits,
  formatDate,
  formatMoney,
  formatNumber,
  percentOf,
  toPercent,
} from "@/components/dashboard/format";
import { cn } from "@/lib/utils";

const USAGE_CHART_CONFIG = {
  used: { label: "Credits used", color: "hsl(var(--primary))" },
  average: { label: "Daily average", color: "hsl(var(--muted-foreground))" },
} satisfies ChartConfig;

const PERIOD_LABELS: Record<UsagePeriod, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
};

const PERIOD_POINTS: Record<UsagePeriod, readonly UsagePoint[]> = {
  day: [],
  week: [],
  month: [],
};

function toneForPercent(percent: number) {
  if (percent >= 90) return { text: "text-red-600 dark:text-red-400", bar: "bg-red-500" };
  if (percent >= 75) return { text: "text-orange-600 dark:text-orange-400", bar: "bg-orange-500" };
  if (percent >= 50) return { text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" };
  return { text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" };
}

export interface CreditUsageDashboardProps {
  /** Allocation, consumption and trend data for the billing period. */
  summary: UsageSummaryType;
  status?: DashboardStatus;
  error?: { message?: string | undefined } | string | null;
  onRetry?: () => void;
  /** Link destination for the low-credit call to action. */
  upgradeHref?: string;
  /** Callback alternative to `upgradeHref`. */
  onNavigateToUpgrade?: () => void;
  className?: string;
}

export function CreditUsageDashboard({
  summary,
  status = "success",
  error,
  onRetry,
  upgradeHref,
  onNavigateToUpgrade,
  className,
}: CreditUsageDashboardProps) {
  const [period, setPeriod] = useState<UsagePeriod>(summary.period ?? "week");

  const points = useMemo(() => {
    const supplied =
      period === "day"
        ? summary.daily
        : period === "week"
          ? summary.weekly
          : summary.monthly;
    return supplied && supplied.length > 0 ? supplied : PERIOD_POINTS[period];
  }, [summary, period]);

  const percent = toPercent(summary.percentConsumed);
  const tone = toneForPercent(percent);
  const thresholds = summary.thresholds ?? DEFAULT_USAGE_THRESHOLDS;
  const valuePerCredit = summary.valuePerCredit ?? CREDIT_VALUE_PER_UNIT;
  const currency = summary.currency ?? "MYR";
  const totalTrend = points.reduce(
    (sum: number, point: UsagePoint) => sum + point.value,
    0,
  );
  const average = points.length > 0 ? totalTrend / points.length : 0;

  return (
    <div className={cn("space-y-4", className)}>
      <DashboardStateBoundary
        status={status}
        data={summary}
        error={error}
        label="credit usage"
        loading={<UsageSkeleton />}
        errorFallback={<DocumentErrorState error={error} onRetry={onRetry} />}
      >
        {() => (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="size-4 shrink-0 text-primary" aria-hidden />
                  AI credit usage
                </CardTitle>
                <CardDescription>
                  Allocation for the current billing period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-3xl font-bold tabular-nums">
                      {formatCredits(summary.remaining)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Consumed</p>
                    <p className={cn("text-lg font-semibold tabular-nums", tone.text)}>
                      {Math.round(percent)}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Progress
                    value={percent}
                    aria-label={`${Math.round(percent)} percent of credit allocation consumed`}
                    className="h-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCredits(summary.used)} used</span>
                    <span>{formatCredits(summary.totalAllocated)} allocated</span>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-3">
                  <MetricRow label="Total allocation" value={formatCredits(summary.totalAllocated)} />
                  <MetricRow
                    label="Used"
                    value={formatCredits(summary.used)}
                    hint={`${Math.round(percent)}% of allocation`}
                  />
                  <MetricRow label="Remaining" value={formatCredits(summary.remaining)} />
                </dl>
              </CardContent>
            </Card>

            <ThresholdNotice
              summary={summary}
              percent={percent}
              upgradeHref={upgradeHref}
              onNavigateToUpgrade={onNavigateToUpgrade}
            />

            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="size-4 shrink-0 text-primary" aria-hidden />
                      Usage trend
                    </CardTitle>
                    <CardDescription>
                      {points.length > 0
                        ? `${formatCredits(totalTrend)} across ${points.length} buckets`
                        : "No trend data for this period"}
                    </CardDescription>
                  </div>
                  {summary.projectedExhaustion ? (
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      <Clock className="size-3" aria-hidden />
                      Projected exhausted {formatDate(summary.projectedExhaustion)}
                    </Badge>
                  ) : null}
                </div>
                <Tabs
                  value={period}
                  onValueChange={(value) => setPeriod(value as UsagePeriod)}
                >
                  <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
                    {(Object.keys(PERIOD_LABELS) as UsagePeriod[]).map((key) => (
                      <TabsTrigger key={key} value={key}>
                        {PERIOD_LABELS[key]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="space-y-3">
                {points.length > 0 ? (
                  <>
                    <ChartContainer
                      config={USAGE_CHART_CONFIG}
                      className="h-56 w-full"
                      aria-hidden
                    >
                      <AreaChart
                        data={points as UsagePoint[]}
                        margin={{ left: 4, right: 8, top: 8 }}
                      >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={16}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={40}
                          tickMargin={4}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="line" />}
                        />
                        {average > 0 ? (
                          <ReferenceLine
                            y={average}
                            stroke="hsl(var(--muted-foreground))"
                            strokeDasharray="4 4"
                            label={{
                              value: `avg ${formatNumber(Math.round(average))}`,
                              position: "insideTopRight",
                              fill: "hsl(var(--muted-foreground))",
                              fontSize: 10,
                            }}
                          />
                        ) : null}
                        <Area
                          dataKey="value"
                          type="monotone"
                          stroke="var(--color-used)"
                          fill="var(--color-used)"
                          fillOpacity={0.18}
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ChartContainer>

                    <UsageDataTable points={points} period={period} />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No usage was recorded for the {PERIOD_LABELS[period].toLowerCase()} view.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Usage by feature</CardTitle>
                  <CardDescription>Where the allocation went</CardDescription>
                </CardHeader>
                <CardContent>
                  <FeatureUsageList summary={summary} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ArrowUpRight className="size-4 shrink-0 text-primary" aria-hidden />
                    Usage value
                  </CardTitle>
                  <CardDescription>
                    Indicative value of the credits consumed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid grid-cols-2 gap-4">
                    <MetricRow
                      label="Value consumed"
                      value={formatMoney(summary.used * valuePerCredit, currency)}
                    />
                    <MetricRow
                      label="Value remaining"
                      value={formatMoney(summary.remaining * valuePerCredit, currency)}
                    />
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    1 credit = {formatMoney(valuePerCredit, currency)} usage value. Credits are usage
                    units and are not redeemable for cash.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Warning thresholds</CardTitle>
                <CardDescription>Every level is labelled, not colour-coded alone</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {thresholds.map((threshold) => {
                    const reached = percent >= threshold.at;
                    return (
                      <li
                        key={threshold.at}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <span className="text-sm">
                          {Math.round(threshold.at)}% · {threshold.label}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            reached
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {reached ? "Reached" : "Not reached"}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </DashboardStateBoundary>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function ThresholdNotice({
  summary,
  percent,
  upgradeHref,
  onNavigateToUpgrade,
}: {
  summary: UsageSummaryType;
  percent: number;
  upgradeHref?: string;
  onNavigateToUpgrade?: (() => void) | undefined;
}) {
  if (percent < 75) return null;

  const exhausted = summary.remaining <= 0;
  const tone = percent >= 90 ? "red" : "orange";

  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "red"
          ? "border-red-500/40 bg-red-500/5"
          : "border-orange-500/40 bg-orange-500/5",
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={cn(
            "mt-0.5 size-5 shrink-0",
            tone === "red" ? "text-red-500" : "text-orange-500",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {exhausted ? "Credit allocation exhausted" : "Credits running low"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {Math.round(percent)}% of the allocation is used.{" "}
            {exhausted
              ? "AI features are unavailable until the allocation renews."
              : `${formatCredits(summary.remaining)} credits remain.`}
            {summary.projectedExhaustion
              ? ` Projected to run out on ${formatDate(summary.projectedExhaustion)}.`
              : ""}
          </p>
          {upgradeHref ? (
            <Button size="sm" variant="link" className="mt-1 h-auto px-0" asChild>
              <Link href={upgradeHref}>
                Review your plan
                <ArrowUpRight aria-hidden />
              </Link>
            </Button>
          ) : onNavigateToUpgrade ? (
            <Button
              size="sm"
              variant="link"
              className="mt-1 h-auto px-0"
              onClick={onNavigateToUpgrade}
            >
              Review your plan
              <ArrowUpRight aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FeatureUsageList({ summary }: { summary: UsageSummaryType }) {
  const features = summary.byFeature ?? [];

  if (features.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No feature-level breakdown was supplied for this period.
      </p>
    );
  }

  const max = features.reduce((peak, feature) => Math.max(peak, feature.credits), 0);

  return (
    <ul className="space-y-3">
      {features.map((feature) => {
        const share =
          feature.share ?? (summary.used > 0 ? feature.credits / summary.used : 0);
        const width = max > 0 ? percentOf(feature.credits, max) : 0;
        return (
          <li key={feature.feature} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate">{feature.label}</span>
              <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                {formatCredits(feature.credits)} · {Math.round(share * 100)}%
              </span>
            </div>
            <Progress
              value={width}
              aria-label={`${feature.label}: ${formatCredits(feature.credits)}, ${Math.round(share * 100)} percent of usage`}
              className="h-1.5"
            />
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Visually hidden equivalent of the trend chart.
 *
 * Keeps the visualisation accessible: the plot is decorative to assistive
 * technology and the numbers are exposed as a real table.
 */
function UsageDataTable({
  points,
  period,
}: {
  points: readonly UsagePoint[];
  period: UsagePeriod;
}) {
  return (
    <table className="sr-only">
      <caption>{`${PERIOD_LABELS[period]} credit usage`}</caption>
      <thead>
        <tr>
          <th scope="col">Period</th>
          <th scope="col">Credits used</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.label}>
            <th scope="row">{point.label}</th>
            <td>{formatNumber(point.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UsageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Card>
        <CardContent className="space-y-3 pt-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}