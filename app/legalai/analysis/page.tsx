"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Search,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MOCK_ANALYSIS, MOCK_DOCUMENTS } from "@/lib/lawmate/data";
import { cn } from "@/lib/utils";
import { AIInsightCard } from "@/components/ai/aiinsight-card";
import { AIMetricCard } from "@/components/ai/aimetric-card";

const KIND_LABEL: Record<string, string> = {
  risk: "Risk",
  missing_clause: "Missing clause",
  ambiguity: "Ambiguity",
  termination: "Termination",
  confidentiality: "Confidentiality",
  payment: "Payment",
};

const SEVERITY_TO_INSIGHT: Record<string, "critical" | "warning" | "info"> = {
  high: "critical",
  medium: "warning",
  low: "info",
  info: "info",
};

export default function AnalysisPage() {
  const [selectedDoc, setSelectedDoc] = useState(MOCK_ANALYSIS.documentId);
  const analysis = selectedDoc === MOCK_ANALYSIS.documentId ? MOCK_ANALYSIS : null;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Document Analysis
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered clause extraction, risk identification and quality scoring.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AIMetricCard
            title="Findings"
            value={MOCK_ANALYSIS.findings.length}
            description="Total identified"
            icon={Sparkles}
          />
          <AIMetricCard
            title="High severity"
            value={MOCK_ANALYSIS.findings.filter((f) => f.severity === "high").length}
            description="Need immediate attention"
            icon={Sparkles}
          />
          <AIMetricCard
            title="Parties"
            value={MOCK_ANALYSIS.parties.length}
            description="Detected in document"
            icon={FileText}
          />
          <AIMetricCard
            title="Status"
            value={MOCK_ANALYSIS.status}
            description={MOCK_ANALYSIS.dates[0] ?? "Pending"}
            icon={CheckCircle2}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search documents…"
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Card>
              <CardContent className="p-2 space-y-1">
                {MOCK_DOCUMENTS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDoc(d.id)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md p-2 text-left text-sm transition-colors",
                      selectedDoc === d.id ? "bg-primary/10" : "hover:bg-accent/40",
                    )}
                  >
                    <FileText className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate">{d.name}</span>
                    {d.id === MOCK_ANALYSIS.documentId && (
                      <Badge variant="secondary" className="text-[10px]">Analysed</Badge>
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {!analysis ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="size-6 animate-spin text-primary mb-3" />
                  <p className="font-medium">No analysis available</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Select a document or upload a new one to start analysis.
                  </p>
                  <Button className="mt-4 gap-2" asChild>
                    <Link href="/legalai/documents">
                      <Upload className="size-4" /> Upload document
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base">
                          {MOCK_DOCUMENTS.find((d) => d.id === analysis.documentId)?.name ?? "Document"}
                        </CardTitle>
                        <CardDescription className="mt-1">{analysis.summary}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="gap-1 shrink-0">
                        <CheckCircle2 className="size-3" /> {analysis.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <InfoRow label="Parties" value={analysis.parties.join(", ")} />
                      <InfoRow label="Key dates" value={analysis.dates.join(" · ")} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Findings</CardTitle>
                        <CardDescription>{analysis.findings.length} items identified</CardDescription>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1.5" asChild>
                        <Link href="/legalai/drafting">
                          <Sparkles className="size-3.5" /> Apply fixes
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.findings.map((f) => (
                      <AIInsightCard
                        key={f.id}
                        title={f.title}
                        insight={f.detail}
                        type={SEVERITY_TO_INSIGHT[f.severity] ?? "info"}
                        recommendation={f.recommendation}
                        tags={[
                          KIND_LABEL[f.kind] ?? f.kind,
                          f.severity,
                          ...(f.page ? [`Page ${f.page}`] : []),
                        ]}
                      />
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card/30 p-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xs mt-0.5">{value}</p>
    </div>
  );
}
