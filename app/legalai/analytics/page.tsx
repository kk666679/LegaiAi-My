"use client";

import {
  BarChart3,
  Bot,
  FileText,
  Briefcase,
  Users,
  TrendingUp,
  Activity,
  Sparkles,
  Clock,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_DASHBOARD_METRICS, MOCK_MATTERS, MOCK_DOCUMENTS, MOCK_TASKS } from "@/lib/lawmate/data";

export default function AnalyticsPage() {
  const m = MOCK_DASHBOARD_METRICS;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            Executive Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Workspace performance, AI usage, and operational metrics.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="AI questions" value={m.usage.questionsAsked} icon={Bot} accent="bg-primary/10 text-primary" trend="+12%" />
          <MetricCard label="Documents analysed" value={m.usage.documentsAnalysed} icon={FileText} accent="bg-blue-500/10 text-blue-500" trend="+8%" />
          <MetricCard label="Drafts generated" value={m.usage.draftsGenerated} icon={Sparkles} accent="bg-violet-500/10 text-violet-500" trend="+24%" />
          <MetricCard label="Research sessions" value={m.usage.researchSessions} icon={TrendingUp} accent="bg-emerald-500/10 text-emerald-500" trend="+5%" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">AI usage over time</CardTitle>
              <CardDescription>Questions, analyses and drafts per week.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { week: "W1 Aug", q: 32, a: 8, d: 3 },
                  { week: "W2 Aug", q: 41, a: 10, d: 5 },
                  { week: "W3 Aug", q: 48, a: 9, d: 6 },
                  { week: "W4 Aug", q: 63, a: 9, d: 7 },
                ].map((w) => {
                  const max = 70;
                  return (
                    <div key={w.week} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{w.week}</span>
                        <span className="text-muted-foreground">{w.q + w.a + w.d} actions</span>
                      </div>
                      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                        <div className="bg-primary" style={{ width: `${(w.q / max) * 100}%` }} />
                        <div className="bg-blue-500" style={{ width: `${(w.a / max) * 100}%` }} />
                        <div className="bg-violet-500" style={{ width: `${(w.d / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-2">
                  <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-primary" /> Questions</span>
                  <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500" /> Analyses</span>
                  <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-violet-500" /> Drafts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk distribution</CardTitle>
              <CardDescription>Across {MOCK_MATTERS.length} active matters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <RiskRow label="High" count={m.risks.high} color="bg-red-500" />
              <RiskRow label="Medium" count={m.risks.medium} color="bg-amber-500" />
              <RiskRow label="Low" count={m.risks.low} color="bg-blue-500" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top matters by activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {MOCK_MATTERS.slice(0, 4).map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-md border p-3">
                    <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Briefcase className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.documentsCount} docs · {m.tasksCount} tasks · {m.researchCount} research</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">{m.priority}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Task throughput</CardTitle>
              <CardDescription>Completed vs created this month.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <Mini label="Created" value={MOCK_TASKS.length} icon={Clock} />
                <Mini label="Completed" value={MOCK_TASKS.filter((t) => t.status === "done").length} icon={Activity} />
                <Mini label="Overdue" value={m.tasks.overdue} icon={TrendingUp} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function MetricCard({ label, value, icon: Icon, accent, trend }: { label: string; value: number; icon: any; accent: string; trend?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-md p-2 ${accent}`}>
          <Icon className="size-4" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        {trend && (
          <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
            {trend}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function RiskRow({ label, count, color }: { label: string; count: number; color: string }) {
  const total = count * 2;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, total)}%` }} />
      </div>
    </div>
  );
}

function Mini({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-md border bg-card/30 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
