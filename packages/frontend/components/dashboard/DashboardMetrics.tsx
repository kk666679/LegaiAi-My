/**
 * Dashboard metrics grid + agent swarm status.
 *
 * Purpose
 * -------
 * Renders four headline metric tiles and a scrollable list of agent/worker
 * health indicators. Every value is supplied by the caller — no mock defaults.
 *
 * Props
 * -----
 * `summary`      Headline tiles (jobs, success rate, latency, status).
 * `metrics`      Agent/worker health rows (`DashboardMetric[]` from `types.ts`).
 *
 * The component is server-safe — no client state, no hooks.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { StatusPill, MetricRow } from "@/components/dashboard/Indicators";
import type { DashboardMetric, MetricStatus } from "@/components/dashboard/types";
import { METRIC_STATUS_LABELS } from "@/components/dashboard/types";
import { formatNumber } from "@/components/dashboard/format";

export interface DashboardMetricsProps {
  /** Four headline figures. */
  summary?: {
    jobsToday?: number;
    successRate?: number;
    avgLatency?: string;
    systemStatus?: MetricStatus;
  };
  /** Agent/worker health rows. */
  metrics?: DashboardMetric[];
}

export function DashboardMetrics({ summary = {}, metrics = [] }: DashboardMetricsProps) {
  const {
    jobsToday,
    successRate,
    avgLatency,
    systemStatus = "neutral",
  } = summary;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Jobs today</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {jobsToday !== undefined ? formatNumber(jobsToday) : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Success rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {successRate !== undefined
                ? `${successRate.toFixed(1)}%`
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Overall accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Avg latency</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {avgLatency ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">System status</CardTitle>
              <Activity className={cn(
                "h-4 w-4",
                systemStatus === "healthy" && "text-emerald-500",
                systemStatus === "warning" && "text-amber-500",
                systemStatus === "error" && "text-red-500",
                systemStatus === "neutral" && "text-muted-foreground",
              )} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <StatusPill status={systemStatus} />
            </div>
            <p className="text-xs text-muted-foreground">
              {METRIC_STATUS_LABELS[systemStatus]}
            </p>
          </CardContent>
        </Card>
      </div>

      {metrics.length > 0 ? (
        <section className="space-y-3" aria-label="Agent swarm status">
          <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            <CheckCircle className="size-3" aria-hidden />
            Agent swarm status
          </h3>
          <div className="space-y-2">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className="flex flex-wrap items-start justify-between gap-4 rounded-lg border bg-card/40 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <StatusPill status={metric.status ?? "neutral"} />
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-medium">{metric.label}</h4>
                      {metric.description ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {metric.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right min-w-[80px]">
                    <div className="text-lg font-semibold tabular-nums">
                      {typeof metric.value === "number"
                        ? formatNumber(metric.value)
                        : metric.value}
                    </div>
                  </div>
                  {metric.progress !== undefined ? (
                    <Progress
                      value={metric.progress}
                      className="w-32 h-1.5 shrink-0"
                      aria-label={`${metric.label} progress: ${metric.progress}%`}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}