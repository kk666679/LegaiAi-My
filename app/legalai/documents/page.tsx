"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Search,
  Filter,
  X,
  Sparkles,
  FileSearch,
  MoreHorizontal,
  Archive,
  Copy,
  Trash2,
  CheckCircle2,
  Send,
  Grid2x2,
  List as ListIcon,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Gavel,
  Hash,
  ArrowUpDown,
  FileSignature,
  BookOpen,
  Mail,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { DocumentsShell } from "@/components/documents";
import { NewDocumentDialog } from "@/components/lawmate/NewDocumentDialog";
import { UploadDialog } from "@/components/lawmate/UploadDialog";
import { LegalDisclaimer } from "@/components/lawmate/LegalDisclaimer";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { usePermission } from "@/components/shared/PermissionGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DOC_COURTS,
  DOC_STATUSES,
  DOC_TYPES,
  DEFAULT_DOCUMENT_FILTERS,
  hasActiveDocumentFilters,
  useDocumentLibrary,
  useDocumentMutations,
  type DocumentFilters,
  type DocumentListItem,
} from "@/hooks/useDocuments";
import { useAuth } from "@/components/auth-provider";
import { useDebounce } from "@/hooks/useDebounce";
import { relativeTime } from "@/lib/lawmate/utils";
import { cn } from "@/lib/utils";

const ALL = "all";

const DOC_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  DOC_TYPES.map((t) => [t.value, t.label]),
);
const COURT_LABEL: Record<string, string> = Object.fromEntries(
  DOC_COURTS.map((c) => [c.value, c.label]),
);

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/** Icon per document type, so a mixed library is scannable at a glance. */
const DOC_TYPE_ICON: Record<string, ComponentType<{ className?: string }>> = {
  CONTRACT: FileSignature,
  AGREEMENT: FileSignature,
  PLEADING: Gavel,
  MOTION: Gavel,
  BRIEF: BookOpen,
  MEMORANDUM: FileText,
  LETTER: Mail,
  OTHER: FileText,
};

const DOCUMENT_SECTION_LINKS = [
  {
    title: "Document Drafting",
    description: "Create legal documents with AI.",
    href: "/legalai/draft",
    icon: FileSignature,
    accent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    title: "Drafting Studio",
    description: "Work through an interactive drafting workflow.",
    href: "/legalai/draft",
    icon: Sparkles,
    accent: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  },
  {
    title: "Contracts",
    description: "Create, manage and review contracts.",
    href: "/legalai/contracts",
    icon: FileText,
    accent: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    title: "Document Analysis",
    description: "Upload documents and extract legal insights.",
    href: "/legalai/analysis",
    icon: Search,
    accent: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  {
    title: "Documentation",
    description: "Learn how LegAI's workflows and AI features work.",
    href: "/legalai/docs",
    icon: BookOpen,
    accent: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  },
] as const;

function IconForDocType({ docType }: { docType: string }) {
  const Icon = DOC_TYPE_ICON[docType] ?? FileText;
  return <Icon className="size-4 text-muted-foreground" aria-hidden />;
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const canEdit = usePermission("edit_document");
  const canDelete = usePermission("delete_document");

  const [filters, setFilters] = useState<DocumentFilters>(DEFAULT_DOCUMENT_FILTERS);
  const [view, setView] = useState<"list" | "grid">("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // The search box stays responsive while the (server-side) query is debounced.
  const [searchInput, setSearchInput] = useState(DEFAULT_DOCUMENT_FILTERS.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  // A new result set invalidates any selection made against the previous one.
  useEffect(() => {
    setSelected(new Set());
  }, [debouncedSearch]);

  const {
    documents,
    total,
    stats,
    clientNames,
    clients,
    isLoading,
    isFetching,
    error,
    hasMore,
    loadMore,
    retry,
  } = useDocumentLibrary({ ...filters, search: debouncedSearch });

  const mutations = useDocumentMutations();

  const byStatus = stats?.byStatus ?? {};
  const byType = stats?.byType ?? {};
  const filtersActive = hasActiveDocumentFilters({ ...filters, search: debouncedSearch });

  const setFilter = <K extends keyof DocumentFilters>(
    key: K,
    value: DocumentFilters[K],
  ) => {
    setFilters((cur) => ({ ...cur, [key]: value }));
    // Selection refers to a result set that is about to change.
    setSelected(new Set());
  };

  const clearFilters = () => {
    setSearchInput("");
    setFilters(DEFAULT_DOCUMENT_FILTERS);
    setSelected(new Set());
  };

  const visibleIds = useMemo(() => documents.map((d) => d.id), [documents]);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleOne = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (allSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });

  const run = async (
    label: string,
    action: () => Promise<unknown>,
  ) => {
    try {
      await action();
      toast.success(label);
      setSelected(new Set());
    } catch (err) {
      toast.error(`${label} failed`, {
        description:
          err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const bulkArchive = () =>
    run(`Archived ${selected.size} document(s)`, async () => {
      // Sequential so a single rejected document reports its own reason
      // instead of failing the whole batch opaquely.
      for (const id of selected) await mutations.archive(id);
    });

  const bulkSubmit = () =>
    run(`Submitted ${selected.size} document(s) for review`, async () => {
      for (const id of selected) await mutations.submitForReview(id, user?.id);
    });

  return (
    <DashboardShell>
      <DocumentsShell>
        <div className="space-y-6">
        <PageHeader
          title="Documents"
          description="Upload, organise and act on the legal documents in your workspace."
          actions={
            <>
              <Button
                onClick={() => setUploadOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Upload className="size-4" /> Upload
              </Button>
              <NewDocumentDialog
                clients={clients}
                onCreated={(id) =>
                  toast.success("Opening your new document", {
                    description: id,
                  })
                }
              />
            </>
          }
        />

        <LegalDisclaimer compact />

        <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-background p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Legal document workspace
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Create, manage, analyse and work with legal documents.
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                LegAI helps users create, manage, understand, analyse, and work with legal documents.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" className="gap-2">
                <Link href="/legalai/draft">
                  <Sparkles className="size-4" /> New draft
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setUploadOpen(true)}>
                <Upload className="size-4" /> Upload
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {DOCUMENT_SECTION_LINKS.map(({ title, description, href, icon: Icon, accent }) => (
              <Link
                key={title}
                href={href}
                className="group rounded-xl border bg-background/60 p-3 transition-colors hover:border-primary/30 hover:bg-accent/30"
              >
                <div className={`inline-flex rounded-md border p-2 ${accent}`}>
                  <Icon className="size-4" />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Recent documents</p>
                  <p className="text-xs text-muted-foreground">Most recently updated in your workspace</p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/legalai/documents">View library</Link>
                </Button>
              </div>

              <div className="space-y-2">
                {(documents ?? []).slice(0, 4).map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/legalai/documents/${doc.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card/30 p-3 transition-colors hover:bg-accent/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <IconForDocType docType={doc.docType} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {DOC_TYPE_LABEL[doc.docType] ?? "Document"} • {formatDate(doc.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {doc.status}
                    </Badge>
                  </Link>
                ))}

                {(!documents || documents.length === 0) && (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                    No documents yet. Upload or draft a document to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-3">
                <p className="text-sm font-medium">Quick actions</p>
                <p className="text-xs text-muted-foreground">AI-powered document workflows</p>
              </div>

              <div className="space-y-2">
                <Button asChild variant="secondary" className="w-full justify-start gap-2">
                  <Link href="/legalai/draft">
                    <FileSignature className="size-4" /> Draft a contract
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="w-full justify-start gap-2">
                  <Link href="/legalai/analysis">
                    <Search className="size-4" /> Analyse a file
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="w-full justify-start gap-2">
                  <Link href="/legalai/docs">
                    <BookOpen className="size-4" /> View documentation
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Could not load documents</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>
                {error instanceof Error
                  ? error.message
                  : "The document library is unavailable."}
              </span>
              <Button size="sm" variant="outline" onClick={retry} className="gap-1.5">
                <RefreshCw className="size-3.5" /> Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ── Library metrics (real counts) ────────────────── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Total documents" value={total} icon={FileText} loading={isLoading} />
          <MetricCard
            label="Drafts"
            value={byStatus.draft ?? 0}
            icon={FileText}
            sub="Awaiting completion"
            loading={isLoading}
          />
          <MetricCard
            label="In review"
            value={byStatus.review ?? 0}
            icon={FileSearch}
            sub="With a human reviewer"
            loading={isLoading}
          />
          <MetricCard
            label="Approved"
            value={byStatus.approved ?? 0}
            icon={CheckCircle2}
            sub={stats ? `${stats.recentActivity} updated in 30 days` : undefined}
            loading={isLoading}
          />
        </div>

        {/* ── Toolbar ──────────────────────────────────────── */}
        <Card>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search title, content or case number…"
                  aria-label="Search documents"
                  className="h-9 pl-8 text-sm"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Select
                value={filters.status}
                onValueChange={(v) => setFilter("status", v as DocumentFilters["status"])}
              >
                <SelectTrigger className="h-9 w-full text-xs lg:w-auto" aria-label="Filter by status">
                  <Filter className="size-3" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {DOC_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.docType}
                onValueChange={(v) => setFilter("docType", v as DocumentFilters["docType"])}
              >
                <SelectTrigger className="h-9 w-full text-xs lg:w-auto" aria-label="Filter by type">
                  <FileText className="size-3" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All types</SelectItem>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.court}
                onValueChange={(v) => setFilter("court", v as DocumentFilters["court"])}
              >
                <SelectTrigger className="h-9 w-full text-xs lg:w-auto" aria-label="Filter by court">
                  <Gavel className="size-3" />
                  <SelectValue placeholder="Court" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All courts</SelectItem>
                  {DOC_COURTS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {clients.length > 0 && (
                <Select
                  value={filters.clientId}
                  onValueChange={(v) => setFilter("clientId", v)}
                >
                  <SelectTrigger className="h-9 w-full text-xs lg:w-auto" aria-label="Filter by client">
                    <Hash className="size-3" />
                    <SelectValue placeholder="Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All clients</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select
                value={`${filters.sortBy}:${filters.sortOrder}`}
                onValueChange={(v) => {
                  const [sortBy, sortOrder] = v.split(":");
                  setFilters((cur) => ({
                    ...cur,
                    sortBy: sortBy as DocumentFilters["sortBy"],
                    sortOrder: sortOrder as DocumentFilters["sortOrder"],
                  }));
                }}
              >
                <SelectTrigger className="h-9 w-full text-xs lg:w-auto" aria-label="Sort documents">
                  <ArrowUpDown className="size-3" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt:desc">Recently updated</SelectItem>
                  <SelectItem value="updatedAt:asc">Least recently updated</SelectItem>
                  <SelectItem value="createdAt:desc">Newest first</SelectItem>
                  <SelectItem value="createdAt:asc">Oldest first</SelectItem>
                  <SelectItem value="title:asc">Title A–Z</SelectItem>
                  <SelectItem value="title:desc">Title Z–A</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 self-start lg:self-auto">
                <Button
                  variant={view === "list" ? "secondary" : "ghost"}
                  size="icon"
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <ListIcon className="size-4" />
                </Button>
                <Button
                  variant={view === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                >
                  <Grid2x2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span aria-live="polite">
                {isFetching && !isLoading ? "Updating…" : null}
                {!isFetching && !isLoading
                  ? filtersActive
                    ? `${documents.length} matching of ${total} document(s)`
                    : `${total} document(s)`
                  : null}
              </span>
              {filtersActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs"
                  onClick={clearFilters}
                >
                  <X className="size-3" /> Clear filters
                </Button>
              )}
              {Object.entries(byType)
                .filter(([, n]) => n > 0)
                .slice(0, 4)
                .map(([type, n]) => (
                  <Badge key={type} variant="outline" className="text-[10px]">
                    {DOC_TYPE_LABEL[type] ?? type} · {n}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Bulk actions ─────────────────────────────────── */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
            <span className="text-sm font-medium">
              {selected.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
            <div className="ml-auto flex flex-wrap gap-2">
              {canEdit && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={bulkSubmit}
                    disabled={mutations.isPending}
                  >
                    <Send className="size-3.5" /> Submit for review
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={bulkArchive}
                    disabled={mutations.isPending}
                  >
                    <Archive className="size-3.5" /> Archive
                  </Button>
                </>
              )}
              {canDelete && (
                <span className="self-center text-xs text-muted-foreground">
                  Deletion is available per document and is blocked for approved
                  documents.
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Drop zone ────────────────────────────────────── */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            setUploadOpen(true);
          }}
          className={cn(
            "rounded-lg border-2 border-dashed p-4 text-center text-sm transition-colors sm:p-5",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 bg-muted/20",
          )}
        >
          <p className="text-muted-foreground">
            Drag &amp; drop files to upload, or{" "}
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              browse your device
            </button>
            . PDF, DOCX, TXT, RTF and ODT.
          </p>
        </div>

        {/* ── Results ──────────────────────────────────────── */}
        {isLoading ? (
          <ListSkeleton rows={6} />
        ) : documents.length === 0 ? (
          filtersActive ? (
            <EmptyState
              icon={Search}
              title="No documents match these filters"
              description="Try a different search term, or widen the status, type, court and client filters."
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload a contract, brief or memorandum, or create a document from scratch to start analysing it with AI."
            />
          )
        ) : view === "grid" ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {documents.map((d) => (
              <DocumentCard
                key={d.id}
                doc={d}
                clientName={d.clientId ? clientNames.get(d.clientId) : undefined}
                selected={selected.has(d.id)}
                onToggle={() => toggleOne(d.id)}
                canEdit={canEdit}
                canDelete={canDelete}
                userId={user?.id}
                mutations={mutations}
                onRun={run}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <div className="flex items-center gap-3 border-b bg-muted/40 px-3 py-2">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={toggleAll}
                aria-label="Select all documents"
                disabled={documents.length === 0}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {allSelected ? "Clear selection" : "Select all"}
              </span>
            </div>
            <ul className="divide-y">
              {documents.map((d) => (
                <DocumentRow
                  key={d.id}
                  doc={d}
                  clientName={d.clientId ? clientNames.get(d.clientId) : undefined}
                  selected={selected.has(d.id)}
                  onToggle={() => toggleOne(d.id)}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  userId={user?.id}
                  mutations={mutations}
                  onRun={run}
                />
              ))}
            </ul>
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={loadMore}
              disabled={isFetching}
            >
              {isFetching && <Loader2 className="size-3.5 animate-spin" />}
              Load more
            </Button>
          </div>
        )}
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      </DocumentsShell>
    </DashboardShell>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  sub,
  loading,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-14" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          )}
          {sub && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

type RowProps = {
  doc: DocumentListItem;
  clientName?: string;
  selected: boolean;
  onToggle: () => void;
  canEdit: boolean;
  canDelete: boolean;
  userId?: string;
  mutations: ReturnType<typeof useDocumentMutations>;
  onRun: (label: string, action: () => Promise<unknown>) => void;
};

function docActions({ doc, canEdit, canDelete, userId, mutations, onRun }: RowProps) {
  return {
    analyse: (
      <DropdownMenuItem asChild className="gap-2">
        <Link href={`/legalai/analysis?documentId=${doc.id}`}>
          <Sparkles className="size-3.5" /> Analyse with AI
        </Link>
      </DropdownMenuItem>
    ),
    summarise: (
      <DropdownMenuItem asChild className="gap-2">
        <Link href={`/legalai/analysis?documentId=${doc.id}&mode=summarise`}>
          <FileSearch className="size-3.5" /> Summarise
        </Link>
      </DropdownMenuItem>
    ),
    ask: (
      <DropdownMenuItem asChild className="gap-2">
        <Link href={`/legalai/assistant?context=${doc.id}`}>
          <Sparkles className="size-3.5" /> Ask LawMate about this
        </Link>
      </DropdownMenuItem>
    ),
    submit: canEdit && doc.status === "draft" && (
      <DropdownMenuItem
        className="gap-2"
        onSelect={() =>
          onRun("Submitted for review", () => mutations.submitForReview(doc.id, userId))
        }
      >
        <Send className="size-3.5" /> Submit for review
      </DropdownMenuItem>
    ),
    approve: canEdit && doc.status === "review" && userId && (
      <DropdownMenuItem
        className="gap-2"
        onSelect={() => onRun("Document approved", () => mutations.approve(doc.id, userId))}
      >
        <CheckCircle2 className="size-3.5" /> Approve
      </DropdownMenuItem>
    ),
    duplicate: canEdit && (
      <DropdownMenuItem
        className="gap-2"
        onSelect={() =>
          onRun("Duplicated", async () => {
            const copy = await mutations.duplicate(doc.id);
            toast.success("Copy created as a new draft", {
              description: (copy as { title?: string } | undefined)?.title,
            });
          })
        }
      >
        <Copy className="size-3.5" /> Duplicate
      </DropdownMenuItem>
    ),
    archive: canEdit && doc.status !== "archived" && (
      <DropdownMenuItem
        className="gap-2"
        onSelect={() => onRun("Archived", () => mutations.archive(doc.id))}
      >
        <Archive className="size-3.5" /> Archive
      </DropdownMenuItem>
    ),
    remove: canDelete && (
      <DropdownMenuItem
        className="gap-2 text-destructive focus:text-destructive"
        onSelect={() =>
          onRun("Deleted", async () => {
            await mutations.remove(doc.id);
            toast.info("Deleted", {
              description: "The audit trail records this removal.",
            });
          })
        }
      >
        <Trash2 className="size-3.5" /> Delete
      </DropdownMenuItem>
    ),
  };
}

function DocumentRow(props: RowProps) {
  const { doc, clientName, selected, onToggle } = props;
  const actions = docActions(props);

  return (
    <li
      className={cn(
        "flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-accent/30",
        selected && "bg-primary/5",
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        aria-label={`Select ${doc.title}`}
        className="mt-1"
      />

      <Link
        href={`/legalai/documents/${doc.id}`}
        className="flex min-w-0 flex-1 items-start gap-3"
      >
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <IconForDocType docType={doc.docType} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{doc.title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{DOC_TYPE_LABEL[doc.docType] ?? doc.docType}</span>
            {doc.court && (
              <>
                <span aria-hidden>·</span>
                <span>{COURT_LABEL[doc.court] ?? doc.court}</span>
              </>
            )}
            {doc.caseNumber && (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{doc.caseNumber}</span>
              </>
            )}
            {clientName && (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{clientName}</span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>v{doc.version}</span>
            <span aria-hidden>·</span>
            <span>{relativeTime(doc.updatedAt)}</span>
          </div>
          {doc.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {doc.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] font-normal">
                  {tag}
                </Badge>
              ))}
              {doc.tags.length > 4 && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  +{doc.tags.length - 4}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-1.5">
        <StatusBadge value={doc.status} className="hidden sm:inline-flex" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${doc.title}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {formatDate(doc.updatedAt)}
            </DropdownMenuLabel>
            {actions.analyse}
            {actions.summarise}
            {actions.ask}
            {(actions.submit || actions.approve) && <DropdownMenuSeparator />}
            {actions.submit}
            {actions.approve}
            {(actions.duplicate || actions.archive || actions.remove) && (
              <DropdownMenuSeparator />
            )}
            {actions.duplicate}
            {actions.archive}
            {actions.remove}
            {!props.canEdit && !props.canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Read-only access
                </DropdownMenuLabel>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

function DocumentCard(props: RowProps) {
  const { doc, clientName, selected, onToggle } = props;
  const actions = docActions(props);

  return (
    <Card className={cn("transition-colors", selected && "border-primary/50 bg-primary/5")}>
      <CardContent className="flex h-full flex-col gap-2 p-4">
        <div className="flex items-start gap-2">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            aria-label={`Select ${doc.title}`}
            className="mt-1"
          />
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
            <IconForDocType docType={doc.docType} />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/legalai/documents/${doc.id}`}
              className="line-clamp-2 text-sm font-medium hover:underline"
            >
              {doc.title}
            </Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Actions for ${doc.title}`}
                className="-mr-1 -mt-1 size-8 shrink-0"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {actions.analyse}
              {actions.summarise}
              {actions.ask}
              {(actions.submit || actions.approve) && <DropdownMenuSeparator />}
              {actions.submit}
              {actions.approve}
              {(actions.duplicate || actions.archive || actions.remove) && (
                <DropdownMenuSeparator />
              )}
              {actions.duplicate}
              {actions.archive}
              {actions.remove}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge value={doc.status} />
          <Badge variant="outline" className="text-[10px] font-normal">
            {DOC_TYPE_LABEL[doc.docType] ?? doc.docType}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-normal">
            v{doc.version}
          </Badge>
        </div>

        <dl className="mt-auto space-y-1 pt-1 text-xs text-muted-foreground">
          {clientName && (
            <div className="flex gap-1.5">
              <dt className="shrink-0">Client</dt>
              <dd className="truncate">{clientName}</dd>
            </div>
          )}
          {doc.court && (
            <div className="flex gap-1.5">
              <dt className="shrink-0">Court</dt>
              <dd className="truncate">{COURT_LABEL[doc.court] ?? doc.court}</dd>
            </div>
          )}
          {doc.caseNumber && (
            <div className="flex gap-1.5">
              <dt className="shrink-0">Case</dt>
              <dd className="truncate">{doc.caseNumber}</dd>
            </div>
          )}
          <div className="flex gap-1.5">
            <dt className="shrink-0">Updated</dt>
            <dd className="truncate">{formatDate(doc.updatedAt)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
