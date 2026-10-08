"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpcReact } from "@/clients";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/EmptyState";
import { DocumentActionMenu } from "@/components/documents/actions/document-action-menu";
import { useDocumentMutations } from "@/hooks/useDocuments";
import { toast } from "sonner";
import Link from "next/link";
import { formatDate } from "@/lib/lawmate/utils";
import { cn } from "@/lib/utils";
import {
  FileText,
  FileText as FileTextIcon,
  History,
  Search,
  Sparkles,
  FileSignature,
  Edit3,
  Star,
  Users,
} from "lucide-react";

const DOC_STATUS = ["draft", "review", "approved", "archived"] as const;
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  review: "Review",
  approved: "Approved",
  archived: "Archived",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  review: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-500",
};

const TABS = [
  { id: "preview", label: "Preview", icon: FileTextIcon },
  { id: "analysis", label: "Analysis", icon: Sparkles },
  { id: "versions", label: "Versions", icon: History },
  { id: "studio", label: "Studio", icon: FileSignature },
] as const;

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const requestedTab = searchParams.get("tab");
  const activeTab = TABS.some((tab) => tab.id === requestedTab)
    ? requestedTab!
    : "preview";
  const docMutations = useDocumentMutations();

  const handleTabChange = (tab: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (tab === "preview") nextParams.delete("tab");
    else nextParams.set("tab", tab);
    const query = nextParams.toString();
    router.replace(
      `/lawmate/documents/${encodeURIComponent(id)}${query ? `?${query}` : ""}`,
      { scroll: false },
    );
  };

  const document = trpcReact.documents.getById.useQuery(id, { staleTime: 30_000 });
  const quality = trpcReact.drafting.quality.useQuery({ draftId: id }, { enabled: !!id, staleTime: 30_000 });
  const evidence = trpcReact.drafting.listEvidence.useQuery({ draftId: id }, { enabled: !!id, staleTime: 30_000 });
  const citations = trpcReact.drafting.listCitations?.useQuery?.({ draftId: id }, { enabled: !!id, staleTime: 30_000 }) ?? { data: undefined, isLoading: false };

  const loading = document.isLoading;
  const failed = document.isError;

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6 p-4 lg:p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {TABS.map(t => <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>)}
            </TabsList>
            <TabsContent value="preview"><div className="p-4 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div></TabsContent>
          </Tabs>
        </div>
      </DashboardShell>
    );
  }

  if (failed || !document.data) {
    return (
      <DashboardShell>
        <div className="space-y-6 p-4 lg:p-6">
          <div className="text-center py-12">
            <FileText className="size-12 mx-auto text-destructive" />
            <h2 className="mt-4 text-xl font-semibold">Document not found</h2>
            <p className="mt-2 text-muted-foreground">The document you're looking for doesn't exist or you don't have access.</p>
            <Button asChild className="mt-4"><Link href="/lawmate/documents">Back to documents</Link></Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const doc = document.data;

  const handleRename = (doc: { id: string; title?: string; name?: string }) => {
    const newName = doc.title ?? doc.name ?? "";
    if (!newName) return;
    void (async () => {
      try {
        await docMutations.update(doc.id, { title: newName });
        toast.success("Document renamed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to rename document");
      }
    })();
  };

  const handleDelete = async () => {
    try {
      await docMutations.remove(id);
      toast.success("Document deleted");
      router.push("/lawmate/documents");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  const handleArchive = async () => {
    try {
      await docMutations.archive(id);
      toast.success("Document archived");
      void document.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive document");
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title={doc.title}
          description={
            <>
              <Badge variant="secondary" className="mr-2">{doc.docType}</Badge>
              <Badge variant="outline" className={cn(STATUS_COLORS[doc.status])}>{STATUS_LABELS[doc.status] ?? doc.status}</Badge>
              <span className="mx-2">·</span>
              <span className="text-sm text-muted-foreground">v{doc.version}</span>
            </>
          }
          actions={
            <>
              <Button asChild variant="outline" size="sm"><Link href={`/lawmate/documents/${id}/studio`}>Open Studio</Link></Button>
              <DocumentActionMenu
                document={doc}
                trigger={
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <Edit3 className="size-3.5" /> More
                  </Button>
                }
                onRename={handleRename}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className={cn(STATUS_COLORS[doc.status])}>{STATUS_LABELS[doc.status] ?? doc.status}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{doc.docType}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Version</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-sm font-medium">v{doc.version}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-muted-foreground">{formatDate(doc.updatedAt)}</span>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="gap-2">
                <t.icon className="size-3.5" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-4" /> Document Content
                </CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-md">{doc.content || "No content"}</pre>
              </CardContent>
            </Card>

            {doc.tags && doc.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="size-4" /> Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {doc.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              )}

              {doc.parties && (
                <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="size-4" /> Parties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                    {Object.entries(doc.parties).map(([key, value]) => (
                      <div key={key}><dt className="text-muted-foreground capitalize">{key}</dt><dd>{value as string}</dd></div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-4" /> AI Quality Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quality.isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : quality.data ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <StatCard label="Quality Score" value={`${quality.data.qualityScore}%`} icon={Star} />
                      <StatCard label="Citations" value={`${quality.data.citations.verified}/${quality.data.citations.total} verified`} icon={FileText} />
                      <StatCard label="Evidence Sources" value={quality.data.evidence.count.toString()} icon={Search} />
                    </div>
                    {quality.data.unsupported.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-destructive mb-2">Unsupported Assertions</h4>
                        <ul className="space-y-2">
                          {quality.data.unsupported.map((u: { sentence: string; rationale: string }, i: number) => (
                            <li key={i} className="text-sm text-destructive/80 p-2 rounded bg-destructive/5">
                              {u.sentence} — <em>{u.rationale}</em>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{quality.data.disclaimer}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Run quality analysis to see results</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-4" /> Citations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {citations.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : citations.data && citations.data.length > 0 ? (
                  <div className="space-y-2">
                    {citations.data.map((c: { id: string; displayText: string; status: string; confidence?: number | null }) => (
                      <div key={c.id} className="p-3 rounded-md border bg-card/40">
                        <p className="font-medium text-sm">{c.displayText}</p>
                        <p className="text-xs text-muted-foreground">
                          Status: {c.status} · Confidence: {Math.round((c.confidence ?? 0) * 100)}%
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No citations found</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="size-4" /> Evidence Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evidence.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : evidence.data && evidence.data.length > 0 ? (
                  <div className="space-y-2">
                    {evidence.data.map((e: { id: string; title: string; citation: string; relevance?: number | null }) => (
                      <div key={e.id} className="p-3 rounded-md border bg-card/40">
                        <p className="font-medium text-sm">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.citation} · Relevance: {Math.round((e.relevance ?? 0) * 100)}%
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No evidence sources</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="versions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="size-4" /> Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Version history for this document (v{doc.version})</p>
                <div className="mt-4 space-y-2">
                  <div className="p-3 rounded-md border bg-card/40">
                    <p className="font-medium text-sm">Current version (v{doc.version})</p>
                    <p className="text-xs text-muted-foreground">Updated {formatDate(doc.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="studio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="size-4" /> Drafting Studio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">The drafting studio provides an AI-powered editing environment for this document.</p>
                <Button asChild className="mt-4 gap-2"><Link href={`/lawmate/documents/${id}/studio`}><FileSignature className="size-4" /> Open Studio</Link></Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md bg-primary/10 p-2 text-primary"><Icon className="size-4" /></div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
