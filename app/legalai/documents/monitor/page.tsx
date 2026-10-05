"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Globe,
  Gavel,
  Calendar,
  Plus,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface MonitorItem {
  id: string;
  type: "legislation" | "case" | "guideline" | "regulator";
  title: string;
  status: "new" | "updated" | "stable";
  summary: string;
  date: string;
  source: string;
  jurisdiction: string;
}

const ITEMS: MonitorItem[] = [
  { id: "m-1", type: "legislation", title: "Employment (Amendment) Act 2026", status: "new", summary: "New amendment introduces changes to overtime calculations and flexible working arrangements.", date: "2026-09-01", source: "Federal Gazette", jurisdiction: "Malaysia" },
  { id: "m-2", type: "case", title: "Federal Court clarifies non-compete enforceability", status: "new", summary: "Decision in Tan v Mega Corp provides new guidance on reasonableness of post-termination restrictions.", date: "2026-08-28", source: "Federal Court", jurisdiction: "Malaysia" },
  { id: "m-3", type: "guideline", title: "PDPA: Updated cross-border transfer guidance", status: "updated", summary: "JPDP publishes new standard contractual clauses for cross-border data transfers.", date: "2026-08-25", source: "JPDP", jurisdiction: "Malaysia" },
  { id: "m-4", type: "regulator", title: "BNM policy on AI risk management", status: "new", summary: "Bank Negara Malaysia issues policy document on AI risk management for financial institutions.", date: "2026-08-20", source: "BNM", jurisdiction: "Malaysia" },
  { id: "m-5", type: "legislation", title: "Industrial Relations Act — no recent changes", status: "stable", summary: "No amendments in the last 30 days.", date: "2026-08-15", source: "Federal Gazette", jurisdiction: "Malaysia" },
];

const TYPE_ICON: Record<MonitorItem["type"], any> = {
  legislation: Gavel,
  case: Globe,
  guideline: CheckCircle2,
  regulator: Bell,
};

const STATUS_BADGE: Record<MonitorItem["status"], { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  updated: { label: "Updated", cls: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  stable: { label: "Stable", cls: "bg-muted text-muted-foreground" },
};

export default function MonitorPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              Change Monitor
            </h1>
            <p className="text-sm text-muted-foreground">
              Track regulatory changes, new legislation, and case law developments.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2"
            onClick={() =>
              toast.success("Monitor creation form opens in a new tab", {
                description: "Track legislation, cases, regulators or guidelines by jurisdiction.",
              })
            }
          >
            <Plus className="size-4" /> Add monitor
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryTile label="New this week" value={ITEMS.filter((i) => i.status === "new").length} icon={TrendingUp} accent="bg-emerald-500/10 text-emerald-500" />
          <SummaryTile label="Updated" value={ITEMS.filter((i) => i.status === "updated").length} icon={AlertTriangle} accent="bg-amber-500/10 text-amber-500" />
          <SummaryTile label="Tracked sources" value={12} icon={Globe} accent="bg-blue-500/10 text-blue-500" />
          <SummaryTile label="Last sync" value="5m ago" icon={Calendar} accent="bg-primary/10 text-primary" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent changes</CardTitle>
            <CardDescription>Regulatory and case law updates relevant to your matters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ITEMS.map((item) => {
              const Icon = TYPE_ICON[item.type];
              const status = STATUS_BADGE[item.status];
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-md border bg-card/30 p-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{item.title}</p>
                      <Badge variant="outline" className={`text-[10px] ${status.cls}`}>
                        {status.label}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] capitalize">{item.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.summary}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {item.source} · {item.jurisdiction} · {item.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monitor preferences</CardTitle>
            <CardDescription>Configure which updates you receive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <PrefRow label="New legislation" desc="Federal and state acts and amendments" defaultChecked />
            <PrefRow label="New cases" desc="High court and appellate decisions" defaultChecked />
            <PrefRow label="Regulator updates" desc="BNM, SC, JPDP and other regulators" defaultChecked />
            <PrefRow label="Daily digest" desc="Summary of changes delivered daily" defaultChecked />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function SummaryTile({ label, value, icon: Icon, accent }: { label: string; value: number | string; icon: any; accent: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-md p-2 ${accent}`}>
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PrefRow({ label, desc, defaultChecked }: { label: string; desc: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-card/30 p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={setChecked} />
    </div>
  );
}
