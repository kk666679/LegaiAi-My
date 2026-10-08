// app/lawmate/automations/[id]/analytics/analytics-client.tsx
"use client";
import * as React from "react";
import { KpiCard } from "@/components/matters/charts";
import { Activity, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { trpcReact } from "@/clients";
import type { RouterOutputs } from "@/clients";
import { useParams } from "next/navigation";

type AutomationAnalytics = RouterOutputs["automations"]["analytics"];

export function WorkflowAnalyticsPage({ id }: { id: string }) {
  const [analytics, setAnalytics] = React.useState<AutomationAnalytics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const workflowId = React.useMemo(() => id, [id]);

  React.useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await trpcReact.automations.analytics.query({ automationId: workflowId });
        setAnalytics(data as AutomationAnalytics);
      } catch (err) {
        setError(`Failed to load analytics: ${(err as Error)?.message ?? "Unknown error"}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [workflowId]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Total runs" value="—" icon={<Activity className="size-4" />} />
          <KpiCard label="Success rate" value="—" icon={<CheckCircle2 className="size-4" />} color="hsl(160 84% 39%)" />
          <KpiCard label="Avg duration" value="—" icon={<Clock className="size-4" />} color="hsl(32 95% 44%)" />
          <KpiCard label="Runs (7d)" value="—" icon={<TrendingUp className="size-4" />} color="hsl(262 83% 58%)" />
        </div>
        <p className="text-xs text-muted-foreground">Loading analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <div className="text-xs text-destructive">{error}</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-xs text-muted-foreground">No analytics data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard 
          label="Total runs" 
          value={analytics.totalRuns} 
          icon={<Activity className="size-4" />} 
        />
        <KpiCard 
          label="Success rate" 
          value={analytics.successRate !== null ? `${analytics.successRate}%` : "—"} 
          icon={<CheckCircle2 className="size-4" />} 
          color="hsl(160 84% 39%)"
        />
        <KpiCard 
          label="Avg duration" 
          value={analytics.avgDurationMs !== null ? `${analytics.avgDurationMs}ms` : "—"} 
          icon={<Clock className="size-4" />} 
          color="hsl(32 95% 44%)"
        />
        <KpiCard 
          label="Runs (7d)" 
          value={analytics.runs7d} 
          icon={<TrendingUp className="size-4" />} 
          color="hsl(262 83% 58%)"
        />
      </div>
      {analytics.daily && analytics.daily.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Daily runs (last 7 days)</h3>
          <div className="grid gap-2">
            {analytics.daily.map((day: { date: string; runs: number }) => (
              <div key={day.date} className="text-xs text-muted-foreground flex justify-between">
                <span>{day.date}</span>
                <span>{day.runs}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}