"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Shield,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MOCK_RISKS, MOCK_DASHBOARD_METRICS } from "@/lib/lawmate/data";
import { relativeTime, severityClasses } from "@/lib/lawmate/utils";

export default function RiskPage() {
  const m = MOCK_DASHBOARD_METRICS;
  const totalRisks = m.risks.high + m.risks.medium + m.risks.low;
  const highPct = totalRisks ? Math.round((m.risks.high * 100) / totalRisks) : 0;
  const riskLevel = highPct >= 40 ? "High" : highPct >= 20 ? "Medium" : "Low";

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <AlertTriangle className="size-5 text-primary" />
            Risk Engine
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered risk analysis across all matters and documents.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Overall risk level</p>
                <p className="text-3xl font-semibold tracking-tight">{riskLevel}</p>
              </div>
              <div className="flex-1 max-w-md">
                <Progress value={highPct} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {totalRisks} total risks · {highPct}% high severity
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <SeverityCard label="High" count={m.risks.high} icon={AlertTriangle} color="text-red-500" bg="bg-red-500/10" border="border-red-500/30" />
          <SeverityCard label="Medium" count={m.risks.medium} icon={AlertTriangle} color="text-amber-500" bg="bg-amber-500/10" border="border-amber-500/30" />
          <SeverityCard label="Low" count={m.risks.low} icon={Shield} color="text-blue-500" bg="bg-blue-500/10" border="border-blue-500/30" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">All risks</CardTitle>
                <CardDescription>{MOCK_RISKS.length} risks across your matters.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {MOCK_RISKS.map((r) => {
              const s = severityClasses(r.severity);
              return (
                <Link
                  key={r.id}
                  href="/legalai/matters"
                  className={`flex items-start gap-3 rounded-md border p-3 transition-colors ${s.bg} ${s.border} hover:opacity-90`}
                >
                  <span className={`mt-1 size-2 shrink-0 rounded-full ${s.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{r.title}</p>
                      <Badge variant="outline" className={`text-[10px] ${s.text} ${s.border}`}>
                        {s.label}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">{r.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {relativeTime(r.createdAt)}
                    </p>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground mt-1" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function SeverityCard({ label, count, icon: Icon, color, bg, border }: { label: string; count: number; icon: any; color: string; bg: string; border: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tracking-tight">{count}</p>
          </div>
          <div className={`rounded-md p-2 ${bg} ${color} ${border} border`}>
            <Icon className="size-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
