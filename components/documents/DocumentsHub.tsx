"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowDownUp,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileSignature,
  FileText,
  FolderOpen,
  Grid2X2,
  List,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDocumentLibrary, type DocumentFilters, type DocumentListItem } from "@/hooks/useDocuments";
import { NewDocumentDialog } from "@/components/lawmate/NewDocumentDialog";
import { UploadDialog } from "@/components/lawmate/UploadDialog";
import { useDebounce } from "@/hooks/useDebounce";

const typeLabels: Record<string, string> = {
  CONTRACT: "Contract", AGREEMENT: "Agreement", PLEADING: "Pleading", MOTION: "Motion",
  BRIEF: "Brief", MEMORANDUM: "Memorandum", LETTER: "Letter", OTHER: "Document",
};

const statusMeta: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  review: { label: "In review", className: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  archived: { label: "Archived", className: "bg-slate-500/10 text-slate-600 dark:text-slate-300" },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

function DocumentIcon({ type }: { type: string }) {
  const Icon = type === "CONTRACT" || type === "AGREEMENT" ? FileSignature : FileText;
  return <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon aria-hidden /></span>;
}

function StatCard({ icon: Icon, label, value, detail }: { icon: typeof FileText; label: string; value: string | number; detail: string }) {
  return <Card size="sm"><CardContent className="flex items-start gap-3 pt-3"><span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon aria-hidden /></span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight">{value}</p><p className="mt-0.5 text-xs text-muted-foreground">{detail}</p></div></CardContent></Card>;
}

function DocumentRow({ document, clientName }: { document: DocumentListItem; clientName?: string }) {
  const status = statusMeta[document.status] ?? {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  };
  return <div className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/40">
    <DocumentIcon type={document.docType} />
    <div className="min-w-0 flex-1"><Link href={`/legalai/documents/${document.id}`} className="truncate text-sm font-medium hover:text-primary hover:underline">{document.title}</Link><div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"><span>{typeLabels[document.docType] ?? "Document"}</span><span aria-hidden>·</span><span>{clientName ?? "Workspace"}</span><span aria-hidden>·</span><span>v{document.version}</span></div></div>
    <div className="hidden items-center gap-3 text-right sm:flex"><Badge variant="secondary" className={cn("border-0", status.className)}>{status.label}</Badge><span className="w-20 text-xs text-muted-foreground">{formatDate(document.updatedAt)}</span></div>
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={`Actions for ${document.title}`}><MoreHorizontal aria-hidden /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/legalai/documents/${document.id}`}>Open document</Link></DropdownMenuItem><DropdownMenuItem asChild><Link href={`/legalai/analysis?documentId=${document.id}`}>Analyse with AI</Link></DropdownMenuItem><DropdownMenuItem onClick={() => toast.success("Document added to favourites")}>Add to favourites</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
  </div>;
}

function EmptyDocuments({ onCreate, onUpload }: { onCreate: () => void; onUpload: () => void }) {
  return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-10 text-center"><span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><FolderOpen aria-hidden /></span><h3 className="mt-4 font-semibold">Your document workspace is ready</h3><p className="mt-1 max-w-md text-sm text-muted-foreground">Start with a template, upload an existing file, or let LegAI draft the first version.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><Button onClick={onCreate}><Plus data-icon="inline-start" /> Create document</Button><Button variant="outline" onClick={onUpload}><Upload data-icon="inline-start" /> Upload file</Button></div></div>;
}

export function DocumentsHub({ clients = [], onCreated }: { clients?: { id: string; name: string }[]; onCreated?: (id: string) => void }) {
  const [filters, setFilters] = useState<DocumentFilters>({ search: "", status: "all", docType: "all", court: "all", clientId: "all", sortBy: "updatedAt", sortOrder: "desc" });
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const query = useDocumentLibrary({ ...filters, search: debouncedSearch });
  const stats = query.stats;
  const clientNames = query.clientNames;
  const visibleDocuments = useMemo(() => query.documents, [query.documents]);
  const reviewCount = stats?.byStatus?.review ?? 0;

  const updateFilter = <K extends keyof DocumentFilters>(key: K, value: DocumentFilters[K]) => setFilters((current) => ({ ...current, [key]: value }));

  return <div className="flex min-w-0 flex-col gap-6">
    <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Legal workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Documents</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Create, understand, review, and govern every legal document in one place.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setUploadOpen(true)}><Upload data-icon="inline-start" /> Upload</Button><Button onClick={() => setCreateOpen(true)}><Plus data-icon="inline-start" /> New document</Button></div></div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={FileText} label="All documents" value={stats?.total ?? 0} detail="Across your workspace" /><StatCard icon={Clock3} label="Recently updated" value={stats?.recentActivity ?? 0} detail="In the last 30 days" /><StatCard icon={FileCheck2} label="Needs review" value={reviewCount} detail="Ready for your attention" /><StatCard icon={ShieldCheck} label="Approved" value={stats?.byStatus?.approved ?? 0} detail="Governed and finalised" /></div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]"><Card className="min-w-0"><CardHeader className="border-b"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Document library</CardTitle><p className="mt-1 text-sm text-muted-foreground">Search by title, content, type, party, or case metadata.</p></div><div className="flex items-center gap-1 rounded-lg border p-1"><Button variant={view === "list" ? "secondary" : "ghost"} size="icon" className="size-8" onClick={() => setView("list")} aria-label="List view"><List aria-hidden /></Button><Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="size-8" onClick={() => setView("grid")} aria-label="Grid view"><Grid2X2 aria-hidden /></Button></div></div></CardHeader><CardContent className="flex flex-col gap-4 pt-4"><div className="flex flex-col gap-2 lg:flex-row"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents..." className="pl-9" aria-label="Search documents" /></div><Select value={filters.status} onValueChange={(value) => updateFilter("status", value as DocumentFilters["status"])}><SelectTrigger className="w-full lg:w-36"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="review">In review</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select><Select value={filters.docType} onValueChange={(value) => updateFilter("docType", value as DocumentFilters["docType"])}><SelectTrigger className="w-full lg:w-40"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{Object.entries(typeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={(value) => { const [sortBy, sortOrder] = value.split("-"); updateFilter("sortBy", sortBy as DocumentFilters["sortBy"]); updateFilter("sortOrder", sortOrder as DocumentFilters["sortOrder"]); }}><SelectTrigger className="w-full lg:w-44"><ArrowDownUp className="mr-2" aria-hidden /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="updatedAt-desc">Recently updated</SelectItem><SelectItem value="createdAt-desc">Recently created</SelectItem><SelectItem value="title-asc">Name A–Z</SelectItem><SelectItem value="title-desc">Name Z–A</SelectItem></SelectContent></Select></div><Separator />{query.isLoading ? <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Loading your documents…</div> : visibleDocuments.length === 0 ? <EmptyDocuments onCreate={() => setCreateOpen(true)} onUpload={() => setUploadOpen(true)} /> : <div className={cn("flex flex-col gap-2", view === "grid" && "grid gap-3 sm:grid-cols-2")}>{visibleDocuments.map((document) => <DocumentRow key={document.id} document={document} clientName={document.clientId ? clientNames.get(document.clientId) : undefined} />)}</div>}{query.hasMore && <Button variant="outline" onClick={query.loadMore} disabled={query.isFetching}>Load more documents</Button>}</CardContent></Card>

    <aside className="flex flex-col gap-4"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Sparkles className="text-primary" aria-hidden /> Workflows</CardTitle></CardHeader><CardContent className="flex flex-col gap-2"><Button variant="outline" className="justify-start" asChild><Link href="/legalai/drafting"><FileSignature data-icon="inline-start" /> Draft with AI</Link></Button><Button variant="outline" className="justify-start" asChild><Link href="/legalai/analysis"><BarChart3 data-icon="inline-start" /> Analyse a document</Link></Button><Button variant="outline" className="justify-start" asChild><Link href="/legalai/contracts"><ShieldCheck data-icon="inline-start" /> Review contracts</Link></Button></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Workspace health</CardTitle></CardHeader><CardContent className="flex flex-col gap-3"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Review completion</span><span className="font-medium">{stats?.total ? Math.round(((stats.byStatus?.approved ?? 0) / stats.total) * 100) : 0}%</span></div><Progress value={stats?.total ? ((stats.byStatus?.approved ?? 0) / stats.total) * 100 : 0} /><div className="flex items-center gap-2 text-xs text-muted-foreground"><Users aria-hidden /> Shared workspace controls enabled</div></CardContent></Card><Card className="bg-primary/5"><CardContent className="flex gap-3 pt-4"><Star className="mt-0.5 shrink-0 text-primary" aria-hidden /><div><p className="text-sm font-medium">Keep important work close</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Favourite documents appear here for faster access and review.</p></div></CardContent></Card></aside></div>

    <NewDocumentDialog clients={clients} onCreated={onCreated} /><UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
  </div>;
}

export default DocumentsHub;
