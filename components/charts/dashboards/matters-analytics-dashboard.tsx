// components/matters/charts/dashboards/matters-analytics-dashboard.tsx
"use client";

import * as React from "react";
import { Briefcase, CalendarClock, Clock, TrendingUp } from "lucide-react";
import { KpiCard } from "../kpi/kpi-card";
import { MatterStatusChart, type MatterStatusChartDatum } from "../distributions/matter-status-chart";
import { PracticeAreaChart, type PracticeAreaDatum } from "../distributions/practice-area-chart";
import { MattersOpenedChart, type MattersOpenedDatum } from "../timeseries/matters-opened-chart";
import { TaskCompletionChart, type TaskCompletionDatum } from "../timeseries/task-completion-chart";
import { DeadlinePressureChart, type DeadlinePressureBucket } from "../operational/deadline-pressure-chart";
import { TeamWorkloadChart, type TeamWorkloadDatum } from "../comparisons/team-workload-chart";
import type { MatterStatus } from "../../matters/types";

export interface MattersAnalyticsDashboardProps {
  kpis: {
    totalMatters: number;
    openMatters: number;
    deadlinesThisWeek: number;
    avgCycleDays: number;
    deltas?: {
      totalMatters?: number;
      openMatters?: number;
      deadlinesThisWeek?: number;
      avgCycleDays?: number;
    };
  };
  statusData: MatterStatusChartDatum[];
  practiceData: PracticeAreaDatum[];
  openedData: MattersOpenedDatum[];
  tasksData: TaskCompletionDatum[];
  deadlineBuckets: DeadlinePressureBucket[];
  teamWorkload: TeamWorkloadDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onStatusSelect?: (s: MatterStatus) => void;
}

export function MattersAnalyticsDashboard({
  kpis,
  statusData,
  practiceData,
  openedData,
  tasksData,
  deadlineBuckets,
  teamWorkload,
  loading,
  error,
  onRetry,
  onStatusSelect,
}: MattersAnalyticsDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total matters"
          value={kpis.totalMatters.toLocaleString()}
          delta={kpis.deltas?.totalMatters}
          deltaLabel="vs last period"
          icon={<Briefcase className="size-4" />}
          trend={openedData.map((d) => d.opened)}
        />
        <KpiCard
          label="Open matters"
          value={kpis.openMatters.toLocaleString()}
          delta={kpis.deltas?.openMatters}
          deltaLabel="vs last period"
          icon={<TrendingUp className="size-4" />}
          color="hsl(160 84% 39%)"
        />
        <KpiCard
          label="Deadlines (7d)"
          value={kpis.deadlinesThisWeek.toLocaleString()}
          delta={kpis.deltas?.deadlinesThisWeek}
          deltaLabel="vs last week"
          invertColor
          icon={<CalendarClock className="size-4" />}
          color="hsl(32 95% 44%)"
        />
        <KpiCard
          label="Avg cycle time"
          value={`${kpis.avgCycleDays.toFixed(1)}`}
          unit="days"
          delta={kpis.deltas?.avgCycleDays}
          invertColor
          deltaLabel="vs last period"
          icon={<Clock className="size-4" />}
          color="hsl(262 83% 58%)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MatterStatusChart
          data={statusData}
          loading={loading}
          error={error}
          onRetry={onRetry}
          onSelect={onStatusSelect}
        />
        <PracticeAreaChart
          data={practiceData}
          loading={loading}
          error={error}
          onRetry={onRetry}
        />
        <DeadlinePressureChart
          data={deadlineBuckets}
          loading={loading}
          error={error}
          onRetry={onRetry}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MattersOpenedChart data={openedData} loading={loading} error={error} onRetry={onRetry} />
        <TaskCompletionChart data={tasksData} loading={loading} error={error} onRetry={onRetry} />
      </div>

      <TeamWorkloadChart data={teamWorkload} loading={loading} error={error} onRetry={onRetry} />
    </div>
  );
}
