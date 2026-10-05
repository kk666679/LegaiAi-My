"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  Scale,
  Download,
  ArrowRight,
  AlertTriangle,
  Gavel,
  ScrollText,
  Boxes,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactContent,
} from "@/components/ai-elements/artifact";
import { AIInsightCard } from "@/components/ai/aiinsight-card";
import { AIMetricCard } from "@/components/ai/aimetric-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  useDocumentLibrary,
  useDocument,
  DEFAULT_DOCUMENT_FILTERS,
  type DocumentFilters,
} from "@/hooks/useDocuments";
import {
  analyzeDocument,
  type AnalyzedDocument,
  type DocumentRecord,
} from "@/lib/lawmate/document-analysis";
import { relativeTime } from "@/lib/lawmate/utils";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  risk: "Risk",
  missing_clause: "Missing clause",
  ambiguity: "Ambiguity",
  termination: "Termination",
  confidentiality: "Confidentiality",
  payment: "Payment",
  obligation: "Obligation",
  right: "Right",
  restriction: "Restriction",
  penalty: "Penalty",
  party: "Party",
  date: "Date",
  conflict: "Conflict",
};

const SEVERITY_TO_INSIGHT: Record<string, "critical" | "warning" | "info" | "success"> = {
  high: "critical",
  medium: "warning",
  low: "info",
  info: "info",
};

function syncUrl(documentId: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (documentId) url.searchParams.set("documentId", documentId);
  else url.searchParams.delete("documentId");
  window.history.replaceState(null, "", url.toString());
}

export default function AnalysisPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Preselect a document from the ?documentId= deep link (workspace,
  // documents list) without a Suspense boundary — window.location only.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("documentId");
    if (fromUrl) setSelectedId(fromUrl);
  }, []);

  const filters: DocumentFilters = useMemo(
    () => ({ ...DEFAULT_DOCUMENT_FILTERS, search: search.trim() }),
    [search]
  );
  const library = useDocumentLibrary(filters, 50);
  const { documents, isLoading: listLoading, error: listError, retry: retryList } = library;

  // Default to the first document once the list resolves, unless a deep link
  // already pinned one.
  useEffect(() => {
    if (selectedId || documents.length === 0) return;
    const fromUrl = new URLSearchParams(window.location.search).get("documentId");
    const fromUrlValid = fromUrl !== null && documents.some((d) => d.id === fromUrl);
    const target = fromUrlValid ? fromUrl : documents[0]?.id;
    if (target) setSelectedId(target);
  }, [documents, selectedId]);

  const {
    document: fullDoc,
    isLoading: docLoading,
    error: docError,
    retry: retryDoc,
  } = useDocument(selectedId ?? "");

  const record = fullDoc as unknown as DocumentRecord | null;
  const analysis = useMemo(
    () => (record ? analyzeDocument(record) : null),
    [record]
  );

  const select = (id: string) => {
    setSelectedId(id);
    syncUrl(id);
  };

  const exportReport = () => {
    if (!analysis || !record) return;
    const lines = [
      `DOCUMENT ANALYSIS — ${record.title}`,
      `Source: ${record.title} (${humanise(record.docType)}) · v${record.version} · ${record.status}`,
      record.caseNumber ? `Case number: ${record.caseNumber}` : "",
      `Generated: ${new Date(analysis.generatedAt).toLocaleString()}`,
      `Method: ${analysis.provenance.method}`,
      `HITL level: L${analysis.provenance.hitlLevel} (${analysis.provenance.hitlLabel}) — lawyer review required`,
      "",
      `SUMMARY`,
      analysis.summary,
      "",
      `STATISTICS`,
      `Words: ${analysis.stats.wordCount} · Clauses: ${analysis.stats.clauseCount} · Sections: ${analysis.stats.sectionCount} · Est. pages: ${analysis.stats.estimatedPages}`,
      `Risk score: ${analysis.riskScore}/100 · Quality score: ${analysis.qualityScore}/100`,
      "",
      `PARTIES`,
      ...analysis.parties.map((p) => ` - ${p}`),
      "",
      `KEY DATES`,
      ...analysis.dates.map((d) => ` - ${d}`),
      "",
      `FINDINGS (${analysis.findings.length})`,
      ...analysis.findings.map(
        (f, i) =>
          `${i + 1}. [${f.severity.toUpperCase()}] ${f.title} — ${f.detail}${f.recommendation ? `\n   Recommendation: ${f.recommendation}` : ""}${f.excerpt ? `\n   Source: “${f.excerpt}”` : ""}`
      ),
      "",
      "This report was produced by a rule-based extractor. It is not legal advice; verify every finding against the source document.",
    ].filter((l) => l !== "");
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${record.title.replace(/[^\w-]+/g, "-").toLowerCase() || "document"}-analysis.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell>
      <div className="space-y-5">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Document Analysis</p>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Sparkles className="size-5 text-primary" />
              {record ? record.title : "Clause & risk extraction"}
            </h1>
            {record ? (
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px]">
                  {humanise(record.docType)}
                </Badge>
                <StatusBadge value={record.status} />
                <span>· v{record.version}</span>
                {record.caseNumber && <span>· {record.caseNumber}</span>}
                {record.updatedAt && (
                  <span>· updated {relativeTime(record.updatedAt)}</span>
                )}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                AI-powered clause extraction, risk identification and quality
                scoring — every finding quotes its source.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={exportReport} disabled={!analysis || analysis.insufficient}>
              <Download className="size-4" /> Export report
            </Button>
            <Button asChild size="sm" className="gap-2">
              <Link href="/legalai/documents">
                <Upload className="size-4" /> Upload document
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Metrics (real, derived from the selected document) ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <AIMetricCard
            title="Findings"
            value={analysis ? analysis.findings.length : "—"}
            description={analysis ? "Identified in this document" : "Select a document"}
            icon={Sparkles}
          />
          <AIMetricCard
            title="High severity"
            value={analysis ? analysis.findings.filter((f) => f.severity === "high").length : "—"}
            description="Need attention first"
            icon={AlertTriangle}
          />
          <AIMetricCard
            title="Parties"
            value={analysis ? analysis.parties.length : "—"}
            description="Detected in document"
            icon={Scale}
          />
          <AIMetricCard
            title="Risk score"
            value={analysis && !analysis.insufficient ? `${analysis.riskScore}/100` : "—"}
            description={
              analysis && !analysis.insufficient
                ? `Quality ${analysis.qualityScore}/100`
                : "Derived from real findings"
            }
            icon={ShieldCheck}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* ── Document picker (real library) ─────────────────── */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search documents…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 text-sm"
              />
            </div>
            <Artifact>
              <ArtifactHeader>
                <div>
                  <ArtifactTitle>Documents</ArtifactTitle>
                  <ArtifactDescription>
                    {listLoading ? "Loading…" : `${documents.length} in your library`}
                  </ArtifactDescription>
                </div>
                <ArtifactActions>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/legalai/documents">
                      Manage <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </ArtifactActions>
              </ArtifactHeader>
              <ArtifactContent className="max-h-[420px] space-y-1 p-2">
                {listLoading ? (
                  <div className="space-y-1.5 p-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 w-full rounded-md" />
                    ))}
                  </div>
                ) : listError ? (
                  <div className="space-y-2 p-2 text-center">
                    <p className="text-sm text-muted-foreground">Could not load documents.</p>
                    <Button variant="outline" size="sm" onClick={retryList}>
                      Retry
                    </Button>
                  </div>
                ) : documents.length === 0 ? (
                  <EmptyPicker searchActive={search.trim() !== ""} />
                ) : (
                  documents.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => select(d.id)}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-md p-2 text-left text-sm transition-colors",
                        selectedId === d.id ? "bg-primary/10" : "hover:bg-accent/40"
                      )}
                    >
                      <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{d.title}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span>{humanise(d.docType)}</span>
                          <span aria-hidden>·</span>
                          <span>v{d.version}</span>
                        </span>
                      </span>
                      {selectedId === d.id && (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          Analyzing
                        </Badge>
                      )}
                    </button>
                  ))
                )}
              </ArtifactContent>
            </Artifact>
          </div>

          {/* ── Analysis panel ─────────────────────────────────── */}
          <div className="space-y-4">
            {!selectedId || docLoading ? (
              <AnalysisSkeleton />
            ) : docError ? (
              <Artifact>
                <ArtifactContent className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="mb-3 size-6 text-amber-500" />
                  <p className="font-medium">Document not available</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    This document could not be loaded. It may have been deleted
                    or archived.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={retryDoc}>
                      Retry
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/legalai/documents">Choose another</Link>
                    </Button>
                  </div>
                </ArtifactContent>
              </Artifact>
            ) : !analysis ? null : analysis.insufficient ? (
              <InsufficientArtifact
                title={record?.title ?? "Document"}
                onPick={() => setSelectedId(null)}
              />
            ) : (
              <>
                {/* Overview */}
                <Artifact>
                  <ArtifactHeader>
                    <div className="min-w-0 flex-1">
                      <ArtifactTitle>{record?.title ?? "Document"}</ArtifactTitle>
                      <ArtifactDescription className="mt-1 line-clamp-3">
                        {analysis.summary}
                      </ArtifactDescription>
                    </div>
                    <ArtifactActions>
                      <Badge variant="secondary" className="shrink-0 gap-1">
                        <CheckCircle2 className="size-3" /> Analysed
                      </Badge>
                    </ArtifactActions>
                  </ArtifactHeader>
                  <ArtifactContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <InfoStat label="Clauses" value={String(analysis.stats.clauseCount)} />
                      <InfoStat label="Sections" value={String(analysis.stats.sectionCount)} />
                      <InfoStat label="Words" value={String(analysis.stats.wordCount)} />
                      <InfoStat label="Est. pages" value={String(analysis.stats.estimatedPages)} />
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <InfoRow
                        label="Parties"
                        value={
                          analysis.parties.length
                            ? analysis.parties.join(", ")
                            : "No parties detected"
                        }
                      />
                      <InfoRow
                        label="Key dates"
                        value={
                          analysis.dates.length
                            ? analysis.dates.join(" · ")
                            : "No explicit dates found"
                        }
                      />
                    </div>
                    <ProvenanceStrip analysis={analysis} />
                  </ArtifactContent>
                </Artifact>

                {/* Findings */}
                <Artifact>
                  <ArtifactHeader>
                    <div>
                      <ArtifactTitle>Findings</ArtifactTitle>
                      <ArtifactDescription>
                        {analysis.findings.length}
                        {analysis.findings.length
                          ? " item(s) identified — each quotes its source"
                          : " risk areas identified in this document"}
                      </ArtifactDescription>
                    </div>
                    <ArtifactActions>
                      {analysis.findings.length > 0 && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/legalai/draft">
                            <Sparkles className="size-4" />
                            <span>Apply fixes</span>
                          </Link>
                        </Button>
                      )}
                    </ArtifactActions>
                  </ArtifactHeader>
                  <ArtifactContent className="space-y-2">
                    {analysis.findings.length === 0 ? (
                      <div className="flex items-start gap-3 rounded-md border border-emerald-500/25 bg-emerald-500/5 p-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        <div>
                          <p className="text-sm font-medium">
                            No high-risk patterns detected
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            The common risk clauses below were not found. That does
                            not guarantee the document is risk-free — a lawyer
                            should still review it.
                          </p>
                        </div>
                      </div>
                    ) : (
                      analysis.findings.map((f) => (
                        <AIInsightCard
                          key={f.id}
                          title={f.title}
                          insight={f.detail}
                          type={SEVERITY_TO_INSIGHT[f.severity] ?? "info"}
                          recommendation={f.recommendation}
                          tags={[
                            KIND_LABEL[f.kind] ?? f.kind,
                            f.severity,
                            ...(f.excerpt ? ["Source quoted"] : []),
                          ]}
                        />
                      ))
                    )}
                    {/* Source excerpts panel */}
                    {analysis.findings.some((f) => f.excerpt) && (
                      <div className="rounded-md border bg-card/30 p-3">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <ScrollText className="size-3.5" /> Source evidence
                        </p>
                        <div className="space-y-2">
                          {analysis.findings
                            .filter((f) => f.excerpt)
                            .map((f) => (
                              <div key={f.id} className="text-xs">
                                <p className="font-medium">
                                  {f.title}
                                </p>
                                <p className="mt-0.5 border-l-2 border-primary/30 pl-2 italic text-muted-foreground">
                                  “{f.excerpt}”
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </ArtifactContent>
                </Artifact>

                {/* Quality & risk */}
                <Artifact>
                  <ArtifactHeader>
                    <div>
                      <ArtifactTitle>Quality &amp; risk</ArtifactTitle>
                      <ArtifactDescription>
                        Derived from the real findings above — not a fixed value.
                      </ArtifactDescription>
                    </div>
                  </ArtifactHeader>
                  <ArtifactContent className="space-y-4">
                    <ScoreBar
                      label="Risk score"
                      value={analysis.riskScore}
                      tone={analysis.riskScore >= 50 ? "destructive" : analysis.riskScore >= 25 ? "warning" : "success"}
                      hint={
                        analysis.riskScore >= 50
                          ? "Elevated risk — review before signing"
                          : analysis.riskScore >= 25
                            ? "Moderate risk — review key clauses"
                            : "Low detected risk"
                      }
                    />
                    <ScoreBar
                      label="Document quality"
                      value={analysis.qualityScore}
                      tone={analysis.qualityScore >= 70 ? "success" : analysis.qualityScore >= 40 ? "warning" : "destructive"}
                      hint="Starts at 100; reduced by detected risk areas."
                    />
                  </ArtifactContent>
                </Artifact>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

// ── Local presentational helpers ──────────────────────────────────────────

function humanise(docType?: string | null): string {
  const known: Record<string, string> = {
    CONTRACT: "Contract",
    AGREEMENT: "Agreement",
    BRIEF: "Brief",
    MOTION: "Motion",
    MEMORANDUM: "Memorandum",
    PLEADING: "Pleading",
    LETTER: "Letter",
    OTHER: "Document",
  };
  if (!docType) return "Document";
  return known[docType] ?? docType.toLowerCase().replace(/_/g, " ");
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card/30 p-2 text-center">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card/30 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xs">{value}</p>
    </div>
  );
}

function ProvenanceStrip({ analysis }: { analysis: AnalyzedDocument }) {
  const p = analysis.provenance;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Gavel className="size-3.5" />
        <span className="font-medium text-foreground">Provenance</span>
      </span>
      <span>Source: {p.source}</span>
      <span>Method: {p.method}</span>
      <span className="flex items-center gap-1">
        <Boxes className="size-3.5" />
        HITL L{p.hitlLevel} ({p.hitlLabel})
      </span>
      <span>Confidence {Math.round(p.confidence * 100)}%</span>
      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="size-3.5" /> {p.note}
      </span>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "destructive";
  hint?: string;
}) {
  const barColor =
    tone === "destructive"
      ? "bg-destructive"
      : tone === "warning"
        ? "bg-amber-500"
        : "bg-emerald-500";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {value}
          <span className="text-xs">/100</span>
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full", barColor)}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function EmptyPicker({ searchActive }: { searchActive: boolean }) {
  return (
    <div className="space-y-2 p-3 text-center">
      <p className="text-sm font-medium">
        {searchActive ? "No documents match your search" : "No documents yet"}
      </p>
      <p className="text-xs text-muted-foreground">
        {searchActive
          ? "Try a different search term."
          : "Upload a contract, brief or memorandum to analyse it."}
      </p>
      {!searchActive && (
        <Button asChild size="sm">
          <Link href="/legalai/documents">
            <Upload className="size-3.5" /> Upload
          </Link>
        </Button>
      )}
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-4">
      <Artifact>
        <ArtifactContent className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="mb-3 size-6 animate-spin text-primary" />
          <p className="font-medium">Loading document…</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Fetching the full document and running extraction.
          </p>
        </ArtifactContent>
      </Artifact>
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    </div>
  );
}

function InsufficientArtifact({
  title,
  onPick,
}: {
  title: string;
  onPick: () => void;
}) {
  return (
    <Artifact>
      <ArtifactHeader>
        <div className="min-w-0 flex-1">
          <ArtifactTitle>{title}</ArtifactTitle>
          <ArtifactDescription>
            Not enough text to analyse reliably.
          </ArtifactDescription>
        </div>
        <ArtifactActions>
          <Badge variant="outline" className="gap-1 text-[10px]">
            <AlertTriangle className="size-3" /> Insufficient evidence
          </Badge>
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent className="flex flex-col items-center justify-center py-12 text-center">
        <Scale className="mb-3 size-6 text-muted-foreground" />
        <p className="font-medium">Insufficient verified evidence</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This document contains too little text for clause and risk extraction.
          Upload a fuller version to obtain findings.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={onPick}>
            Choose another document
          </Button>
          <Button size="sm" asChild>
            <Link href="/legalai/documents">
              <Upload className="size-4" /> Upload document
            </Link>
          </Button>
        </div>
      </ArtifactContent>
    </Artifact>
  );
}
