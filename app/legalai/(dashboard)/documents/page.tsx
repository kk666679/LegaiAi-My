"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Upload, Filter, X, FileText, Search, BookTemplate, Sparkles, Star, Share2, Library, Archive, Trash2, History } from "lucide-react";
import { trpcReact } from "@/clients";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/EmptyState";
import { UploadDialog } from "@/components/lawmate/UploadDialog";
import { cn } from "@/lib/utils";
import Link from "next/link";

const DOC_STATUS = ["draft", "review", "approved", "archived"] as const;
const DOC_TYPE = [
  "CONTRACT", "BRIEF", "MOTION", "MEMORANDUM", "PLEADING", "AGREEMENT", "LETTER", "OTHER"
] as const;

type DocStatus = typeof DOC_STATUS[number];
type DocType = typeof DOC_TYPE[number];

const STATUS_LABELS: Record<DocStatus, string> = {
  draft: "Draft",
  review: "Review",
  approved: "Approved",
  archived: "Archived",
};

const STATUS_COLORS: Record<DocStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  review: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-500",
};

export default function DocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uploadOpen, setUploadOpen] = React.useState(false);

  const getParam = (key: string) => searchParams.get(key) ?? undefined;

  const filters = {
    docType: getParam("docType") as DocType | undefined,
    status: getParam("status") as DocStatus | undefined,
    clientId: getParam("clientId") ?? undefined,
    caseNumber: getParam("caseNumber") ?? undefined,
    court: getParam("court") ?? undefined,
    search: getParam("search") ?? undefined,
    limit: 20,
    cursor: getParam("cursor") ?? undefined,
  };

  const { data, isLoading, isError, error, refetch } = trpcReact.documents.list.useQuery(filters);
  const stats = trpcReact.documents.stats.useQuery(undefined, { staleTime: 30_000 });

  const documents = data?.documents ?? [];
  const nextCursor = data?.nextCursor;
  const hasMore = data?.hasMore ?? false;

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    params.delete("cursor");
    router.push(`/legalai/documents?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/legalai/documents");
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== "" && v !== 20);

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
    } catch { return "—"; }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Documents"
          description="Manage legal documents across your workspace."
          actions={
            <>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
                  <X className="size-3.5" /> Clear filters
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5">
                <Upload className="size-3.5" /> Upload
              </Button>
              <Button onClick={() => router.push("/legalai/documents/new")} size="sm" className="gap-1.5">
                <Plus className="size-3.5" /> New document
              </Button>
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">{stats.data?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">{stats.data?.byStatus?.draft ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-blue-600">{stats.data?.byStatus?.review ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-green-600">{stats.data?.byStatus?.approved ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4" /> Quick Navigation
            </CardTitle>
            <CardDescription>Jump to common document views and tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/documents/recent">
                  <div className="flex items-center gap-2">
                    <History className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Recent</p>
                      <p className="text-xs text-muted-foreground">Recently viewed</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/documents/favorites">
                  <div className="flex items-center gap-2">
                    <Star className="size-5 text-amber-500" />
                    <div>
                      <p className="font-medium">Favorites</p>
                      <p className="text-xs text-muted-foreground">Starred documents</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/documents/shared">
                  <div className="flex items-center gap-2">
                    <Share2 className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Shared with me</p>
                      <p className="text-xs text-muted-foreground">Team documents</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/documents/templates">
                  <div className="flex items-center gap-2">
                    <BookTemplate className="size-5 text-primary" />
                    <div>
                      <p className="font-medium">Templates</p>
                      <p className="text-xs text-muted-foreground">Document templates</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/documents/studio">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-primary" />
                    <div>
                      <p className="font-medium">Drafting Studio</p>
                      <p className="text-xs text-muted-foreground">AI-assisted drafting</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/documents/library">
                  <div className="flex items-center gap-2">
                    <Library className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Library</p>
                      <p className="text-xs text-muted-foreground">Organised collections</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/documents?status=archived">
                  <div className="flex items-center gap-2">
                    <Archive className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Archived</p>
                      <p className="text-xs text-muted-foreground">Stored documents</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/documents/trash">
                  <div className="flex items-center gap-2">
                    <Trash2 className="size-5 text-destructive" />
                    <div>
                      <p className="font-medium">Trash</p>
                      <p className="text-xs text-muted-foreground">Deleted items</p>
                    </div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="size-4" /> Filters
                </CardTitle>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={filters.docType ?? "all"} onValueChange={(v) => updateFilters({ docType: v === "all" ? undefined : v as DocType })}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="All types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {DOC_TYPE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.status ?? "all"} onValueChange={(v) => updateFilters({ status: v === "all" ? undefined : v as DocStatus })}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {DOC_STATUS.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search documents..."
                  value={filters.search ?? ""}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="w-[280px]"
                  aria-label="Search documents"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : isError ? (
              <div className="text-center py-8 text-destructive">
                <p>Failed to load documents: {error?.message}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Retry</Button>
              </div>
            ) : documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents found"
                description="Upload a contract, brief or memorandum to analyse it with AI."
                action="Upload document"
                actionHref="/legalai/documents/new"
              />
            ) : (
              <ScrollArea className="max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[350px]">Document</TableHead>
                      <TableHead className="w-[150px]">Type</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[80px]">Version</TableHead>
                      <TableHead className="w-[130px]">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((d: { id: string; title: string; docType: string; status: string; version: number; updatedAt: string }) => (
                      <TableRow key={d.id} className="cursor-pointer hover:bg-accent/40" onClick={() => router.push(`/legalai/documents/${d.id}/preview`)}>
                        <TableCell className="font-medium">
                          <div className="truncate">{d.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{d.docType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(STATUS_COLORS[d.status as DocStatus])}>
                            {STATUS_LABELS[d.status as DocStatus] ?? d.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">v{d.version}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(d.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            {hasMore && nextCursor && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ cursor: nextCursor })}
                  disabled={isLoading}
                >
                  Load more
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </DashboardShell>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "—"; }
}