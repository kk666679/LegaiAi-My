"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Filter,
  Download,
  Eye,
  Trash2,
  Shield,
  Sparkles,
  FileSearch,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadDialog } from "@/components/lawmate/UploadDialog";
import { MOCK_DOCUMENTS, MOCK_MATTERS } from "@/lib/lawmate/data";
import { formatBytes, relativeTime } from "@/lib/lawmate/utils";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/lawmate";
import { AIMetricCard } from "@/components/ai/aimetric-card";
import { AISearchBar } from "@/components/ai/aisearch-bar";
import { AIStatusIndicator } from "@/components/ai/aistatus-indicator";
import { AIAlert } from "@/components/ai/aialert";
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent,
} from "@/components/ai-elements/artifact";
import { Shimmer } from "@/components/ai-elements/shimmer";

const CLASSIFICATION_BADGE: Record<Document["classification"], string> = {
  public: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  internal: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  confidential: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  privileged: "bg-red-500/10 text-red-500 border-red-500/20",
};

const STATUS_TO_INDICATOR: Record<
  Document["status"],
  "syncing" | "success" | "error" | "paused"
> = {
  uploading: "syncing",
  processing: "syncing",
  ready: "success",
  failed: "error",
  archived: "paused",
};

const STATUS_LABEL: Record<Document["status"], string> = {
  uploading: "Uploading",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
  archived: "Archived",
};

export default function DocumentsPage() {
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"all" | "ready" | "processing" | "failed">("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const docs = MOCK_DOCUMENTS.filter((d) => {
    if (filter && !d.name.toLowerCase().includes(filter.toLowerCase())) return false;
    if (tab === "all") return true;
    if (tab === "ready") return d.status === "ready";
    if (tab === "processing") return d.status === "processing" || d.status === "uploading";
    if (tab === "failed") return d.status === "failed";
    return true;
  });

  const stats = {
    total: MOCK_DOCUMENTS.length,
    ready: MOCK_DOCUMENTS.filter((d) => d.status === "ready").length,
    processing: MOCK_DOCUMENTS.filter(
      (d) => d.status === "processing" || d.status === "uploading"
    ).length,
    failed: MOCK_DOCUMENTS.filter((d) => d.status === "failed").length,
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
            <p className="text-sm text-muted-foreground">
              Manage, analyse and act on your legal documents.
            </p>
          </div>
          <Button onClick={() => setUploadOpen(true)} className="gap-2 self-start md:self-auto">
            <Upload className="size-4" /> Upload document
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AIMetricCard title="Total documents" value={stats.total} description="In your library" icon={FileText} />
          <AIMetricCard title="Ready" value={stats.ready} description="Indexed & searchable" icon={FileText} />
          <AIMetricCard title="Processing" value={stats.processing} description="Being analysed" icon={FileSearch} />
          <AIMetricCard title="Failed" value={stats.failed} description="Need attention" icon={AlertCircle} />
        </div>

        {stats.failed > 0 && (
          <AIAlert
            type="error"
            title="Some documents failed to process"
            message={`${stats.failed} document(s) failed ingestion. Check file formats or retry from the row menu.`}
            action={{ label: "View failed", onClick: () => setTab("failed") }}
          />
        )}

        {/* Drop zone */}
        <Artifact
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); setUploadOpen(true); }}
          className={cn("border-dashed transition-colors", dragOver && "border-primary bg-primary/5")}
        >
          <ArtifactContent className="flex flex-col items-center justify-center py-8 sm:py-10 text-center">
            <div className="mb-3 rounded-full bg-primary/10 p-3">
              <Upload className="size-5 text-primary" />
            </div>
            <p className="font-medium">Drag &amp; drop documents here</p>
            <p className="text-xs text-muted-foreground mt-1 px-4">
              PDF, DOCX, TXT, RTF, ODT — files are processed securely.
            </p>
            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => setUploadOpen(true)}>
              <Upload className="size-3.5" /> Choose files
            </Button>
          </ArtifactContent>
        </Artifact>

        {/* Document list */}
        <Artifact>
          <ArtifactHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
              <AISearchBar
                placeholder="Search documents…"
                onSearch={(q) => setFilter(q)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 self-start sm:self-auto"
                onClick={() =>
                  toast.info("Filter sheet coming soon", {
                    description: "Filter by classification, status, matter and date.",
                  })
                }
              >
                <Filter className="size-3.5" /> Filter
              </Button>
            </div>
          </ArtifactHeader>
          <ArtifactContent>
            <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
              <TabsList className="w-full sm:w-auto overflow-x-auto">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="ready">Ready ({stats.ready})</TabsTrigger>
                <TabsTrigger value="processing">Processing ({stats.processing})</TabsTrigger>
                <TabsTrigger value="failed">Failed ({stats.failed})</TabsTrigger>
              </TabsList>
              <TabsContent value={tab} className="mt-4">
                {docs.length === 0 ? (
                  <EmptyDocs />
                ) : (
                  <div className="space-y-2">
                    {docs.map((d) => {
                      const matter = MOCK_MATTERS.find((m) => m.id === d.matterId);
                      const isProcessing = d.status === "processing" || d.status === "uploading";
                      return (
                        <Artifact key={d.id} className="hover:bg-accent/40 transition-colors">
                          <ArtifactHeader>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                                <FileText className="size-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                {isProcessing ? (
                                  <Shimmer as="p" className="font-medium text-sm">{d.name}</Shimmer>
                                ) : (
                                  <ArtifactTitle>{d.name}</ArtifactTitle>
                                )}
                                <ArtifactDescription className="flex items-center gap-1.5 flex-wrap text-xs">
                                  <span>{formatBytes(d.size)}</span>
                                  {d.pageCount && <><span>·</span><span>{d.pageCount} pages</span></>}
                                  <span>·</span>
                                  <span>{relativeTime(d.uploadedAt)}</span>
                                  {matter && <><span>·</span><span className="truncate max-w-[120px]">{matter.name}</span></>}
                                </ArtifactDescription>
                                {isProcessing && <Progress value={60} className="mt-1 h-1" />}
                              </div>
                            </div>
                            <ArtifactActions>
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] gap-1 shrink-0", CLASSIFICATION_BADGE[d.classification])}
                              >
                                <Shield className="size-3" />
                                {d.classification}
                              </Badge>
                              <AIStatusIndicator
                                status={STATUS_TO_INDICATOR[d.status]}
                                label={STATUS_LABEL[d.status]}
                                size="sm"
                                showPulse={isProcessing}
                              />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <ArtifactAction tooltip="More actions" icon={MoreHorizontal} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/legalai/analysis?documentId=${d.id}`} className="gap-2">
                                      <Sparkles className="size-3.5" /> Analyse
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/legalai/analysis?documentId=${d.id}&mode=summarise`} className="gap-2">
                                      <FileSearch className="size-3.5" /> Summarise
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/legalai/assistant?context=${d.id}`} className="gap-2">
                                      <Eye className="size-3.5" /> Ask LawMate
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="gap-2"
                                    onClick={() => toast.success(`Downloading ${d.name}`)}
                                  >
                                    <Download className="size-3.5" /> Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="gap-2 text-red-500 focus:text-red-500"
                                    onClick={() =>
                                      toast.error(`Deleted ${d.name}`, {
                                        description: "Use the audit trail to recover within 30 days.",
                                      })
                                    }
                                  >
                                    <Trash2 className="size-3.5" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </ArtifactActions>
                          </ArtifactHeader>
                        </Artifact>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </ArtifactContent>
        </Artifact>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </DashboardShell>
  );
}

function EmptyDocs() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <FileText className="size-8 text-muted-foreground opacity-40 mb-3" />
      <p className="font-medium">No documents yet</p>
      <p className="text-sm text-muted-foreground mt-1">
        Upload your first document to begin analysing it with LawMate.
      </p>
    </div>
  );
}
