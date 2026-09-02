"use client";

import Link from "next/link";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Scale,
  ArrowRight,
  Activity,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ComplianceItem {
  id: string;
  framework: string;
  requirement: string;
  status: "compliant" | "attention" | "non_compliant" | "in_progress";
  evidence: number;
  lastReview: string;
  nextReview: string;
}

const ITEMS: ComplianceItem[] = [
  {
    id: "ci-1",
    framework: "PDPA 2010",
    requirement: "Personal data processing consent (s.6, s.7)",
    status: "compliant",
    evidence: 24,
    lastReview: "2026-08-15",
    nextReview: "2026-11-15",
  },
  {
    id: "ci-2",
    framework: "PDPA 2010",
    requirement: "Cross-border data transfer safeguards (s.8)",
    status: "attention",
    evidence: 8,
    lastReview: "2026-08-01",
    nextReview: "2026-10-01",
  },
  {
    id: "ci-3",
    framework: "Employment Act 1955",
    requirement: "Written employment terms (Part II)",
    status: "compliant",
    evidence: 42,
    lastReview: "2026-07-20",
    nextReview: "2026-10-20",
  },
  {
    id: "ci-4",
    framework: "Employment Act 1955",
    requirement: "Wage deduction authorisation (s.24)",
    status: "compliant",
    evidence: 18,
    lastReview: "2026-08-10",
    nextReview: "2026-11-10",
  },
  {
    id: "ci-5",
    framework: "Contracts Act 1950",
    requirement: "Free consent of parties (s.10-14)",
    status: "compliant",
    evidence: 36,
    lastReview: "2026-06-15",
    nextReview: "2026-12-15",
  },
  {
    id: "ci-6",
    framework: "Companies Act 2016",
    requirement: "Directors' duties and disclosures",
    status: "in_progress",
    evidence: 4,
    lastReview: "2026-08-20",
    nextReview: "2026-09-20",
  },
  {
    id: "ci-7",
    framework: "Internal Policy",
    requirement: "AI-assisted output human review",
    status: "compliant",
    evidence: 184,
    lastReview: "2026-09-01",
    nextReview: "2026-12-01",
  },
  {
    id: "ci-8",
    framework: "Internal Policy",
    requirement: "Data classification on all documents",
    status: "attention",
    evidence: 6,
    lastReview: "2026-08-25",
    nextReview: "2026-10-25",
  },
];

const STATUS_BADGE: Record<ComplianceItem["status"], { label: string; cls: string; icon: any }> = {
  compliant: { label: "Compliant", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
  attention: { label: "Attention", cls: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: AlertTriangle },
  non_compliant: { label: "Non-compliant", cls: "bg-red-500/10 text-red-500 border-red-500/20", icon: AlertTriangle },
  in_progress: { label: "In progress", cls: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Clock },
};

export default function CompliancePage() {
  const total = ITEMS.length;
  const compliant = ITEMS.filter((i) => i.status === "compliant").length;
  const attention = ITEMS.filter((i) => i.status === "attention").length;
  const inProgress = ITEMS.filter((i) => i.status === "in_progress").length;
  const nonCompliant = ITEMS.filter((i) => i.status === "non_compliant").length;
  const score = Math.round(((compliant + inProgress * 0.5) / total) * 100);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Compliance
          </h1>
          <p className="text-sm text-muted-foreground">
            Track regulatory and internal policy compliance across all matters.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ScoreCard label="Compliance score" value={`${score}%`} icon={Shield} accent="bg-primary/10 text-primary" />
          <ScoreCard label="Compliant" value={compliant} icon={CheckCircle2} accent="bg-emerald-500/10 text-emerald-500" />
          <ScoreCard label="Needs attention" value={attention} icon={AlertTriangle} accent="bg-amber-500/10 text-amber-500" />
          <ScoreCard label="In progress" value={inProgress} icon={Activity} accent="bg-blue-500/10 text-blue-500" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance register</CardTitle>
            <CardDescription>
              {total} requirements tracked across {Array.from(new Set(ITEMS.map(i => i.framework))).length} frameworks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ITEMS.map((item) => {
                const meta = STATUS_BADGE[item.status];
                const Icon = meta.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-md border bg-card/30 p-3 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Scale className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm leading-tight">{item.requirement}</p>
                        <Badge variant="outline" className={`text-[10px] gap-1 ${meta.cls}`}>
                          <Icon className="size-3" /> {meta.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.framework}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <FileText className="size-3" /> {item.evidence} evidence items
                        </span>
                        <span>Last review: {item.lastReview}</span>
                        <span>Next: {item.nextReview}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 gap-1"
                      onClick={() =>
                        toast.message(`Opening review for "${item.requirement}"`, {
                          description: `${item.framework} · last review ${item.lastReview}`,
                        })
                      }
                    >
                      Review <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function ScoreCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: any; accent: string }) {
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
