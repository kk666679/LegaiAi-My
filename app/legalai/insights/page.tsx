"use client";

import Link from "next/link";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
  Bot,
  Gavel,
  ArrowRight,
  Activity,
  BookOpen,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_ACTIVITY, MOCK_TASKS, MOCK_RISKS } from "@/lib/lawmate/data";
import { relativeTime, severityClasses } from "@/lib/lawmate/utils";

const TIMELINE = [
  { date: "Today", items: [
    { kind: "ai", text: "Citation validation completed for 'Warning Letter — Lim Wei Jian'", at: "2 hours ago", icon: Sparkles },
    { kind: "document", text: "Document analysed: PDPA Audit Findings.pdf — 8 findings", at: "4 hours ago", icon: FileText },
    { kind: "task", text: "Task 'Draft response to claim letter' marked in progress", at: "5 hours ago", icon: CheckCircle2 },
  ]},
  { date: "Yesterday", items: [
    { kind: "matter", text: "Matter 'DataShield — PDPA Audit' updated — 3 new tasks", at: "Yesterday", icon: Gavel },
    { kind: "ai", text: "AI flagged 2 new high-risk items on DataShield matter", at: "Yesterday", icon: AlertCircle },
    { kind: "research", text: "Research saved: PDPA cross-border transfers overview", at: "Yesterday", icon: BookOpen },
    { kind: "document", text: "Document uploaded: Employment Agreement — Lim Wei Jian.pdf", at: "Yesterday", icon: FileText },
  ]},
  { date: "This week", items: [
    { kind: "ai", text: "Draft generated: Warning Letter — Lim Wei Jian", at: "2 days ago", icon: Sparkles },
    { kind: "matter", text: "New matter created: Acquisition: Valley Foods Sdn Bhd", at: "3 days ago", icon: Gavel },
    { kind: "task", text: "Task 'Update hostel rules policy' created", at: "3 days ago", icon: CheckCircle2 },
  ]},
];

export default function InsightsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" />
            Insights & Timeline
          </h1>
          <p className="text-sm text-muted-foreground">
            A chronological view of AI activity, matter changes, and workspace events.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Activity timeline</CardTitle>
              <CardDescription>Most recent events across your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {TIMELINE.map((section) => (
                <div key={section.date} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.date}
                  </h3>
                  <div className="space-y-1.5 border-l-2 border-border ml-2 pl-4">
                    {section.items.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="relative flex items-start gap-3 py-1.5">
                          <span className="absolute -left-[1.4rem] top-2.5 flex size-3 items-center justify-center rounded-full bg-background border-2 border-border">
                            <span className="size-1 rounded-full bg-primary" />
                          </span>
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Icon className="size-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{item.text}</p>
                            <p className="text-[11px] text-muted-foreground">{item.at}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {MOCK_ACTIVITY.slice(0, 5).map((a) => (
                  <Link
                    key={a.id}
                    href={a.href ?? "/legalai"}
                    className="flex items-start gap-2 rounded-md p-2 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Activity className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{a.detail}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{relativeTime(a.at)}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top risks this week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {MOCK_RISKS.filter((r) => r.severity !== "info").slice(0, 4).map((r) => {
                  const s = severityClasses(r.severity);
                  return (
                    <div key={r.id} className={`rounded-md border p-2 ${s.border} ${s.bg}`}>
                      <div className="flex items-center gap-2">
                        <span className={`size-1.5 rounded-full ${s.dot}`} />
                        <span className="text-xs font-medium truncate">{r.title}</span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">{r.description}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
