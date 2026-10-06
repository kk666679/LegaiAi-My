"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Upload } from "lucide-react";
import {
  DocumentActions,
  DocumentLibrary,
  DocumentSearch,
  DocumentsOverview,
  DocumentsProvider,
  DocumentsShell,
  DocumentsHeader,
  NewDocumentDialog,
  useDocumentsList,
  type DocumentFilters,
  type DocumentSort,
  type DocumentViewMode,
  type LegalDocument,
} from "@/components/documents";
import { DocumentUploadDialog } from "@/components/documents/upload/document-upload-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function DocumentsRootPage() {
  const router = useRouter();
  const [view, setView] = React.useState<DocumentViewMode>("grid");
  const [filters, setFilters] = React.useState<DocumentFilters>({});
  const [sort, setSort] = React.useState<DocumentSort>({ key: "updatedAt", direction: "desc" });
  const [newOpen, setNewOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const { documents, stats, loading, error } = useDocumentsList({
    filters,
    sort,
    scope: "all",
  });

  const filtered = React.useMemo(() => {
    const q = (filters.query ?? "").trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) =>
      `${d.name} ${d.type} ${d.category ?? ""} ${(d.tags ?? []).map((t) => t.label).join(" ")}`.toLowerCase().includes(q),
    );
  }, [documents, filters.query]);

  return (
    <DocumentsProvider documents={documents} initialFilters={filters} initialSort={sort}>
      <DocumentsShell
        header={
          <DocumentsHeader
            title="Documents"
            description="Create, upload, analyse, and manage your legal documents."
            actions={
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setUploadOpen(true)}>
                  <Upload className="size-3.5" />
                  Upload
                </Button>
                <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
                  <Plus className="size-3.5" />
                  New document
                </Button>
              </>
            }
          />
        }
      >
        <div className="space-y-6 p-4 lg:p-6">
          <DocumentsOverview
            stats={stats ?? {
              total: 0, ready: 0, processing: 0, review: 0,
              pendingApproval: 0, analysed: 0, favorites: 0,
            }}
            recent={filtered.slice(0, 5)}
            activity={[]}
            onCreate={() => setNewOpen(true)}
            onUpload={() => setUploadOpen(true)}
            onAnalyse={() => router.push("/legalai/documents/library?filter=analysed")}
            onContracts={() => router.push("/legalai/documents/contracts")}
            onDraftingStudio={() => router.push("/legalai/documents/studio")}
            onOpenDocument={(d) => router.push(`/legalai/documents/${d.id}/preview`)}
            onViewAll={() => router.push("/legalai/documents/library")}
          />

          <div className="space-y-3">
            <DocumentSearch
              filters={filters}
              sort={sort}
              onFiltersChange={(n) => setFilters((f) => ({ ...f, ...n }))}
              onReset={() => setFilters({})}
              onSortChange={setSort}
            />
            <DocumentLibrary
              documents={filtered}
              loading={loading}
              view={view}
              onViewChange={setView}
              sort={sort}
              onSortChange={(k) => setSort((s) => ({ ...s, key: k }))}
              onOpen={(d) => router.push(`/legalai/documents/${d.id}/preview`)}
              onFavoriteChange={(d, fav) => {
                // Persist favourite
              }}
              onMenu={(d, anchor) => setSelectedId(d.id)}
              emptyAction={{ label: "New document", onClick: () => setNewOpen(true) }}
              emptySecondaryAction={{ label: "Upload", onClick: () => setUploadOpen(true) }}
            />
          </div>
        </div>
      </DocumentsShell>

      <NewDocumentDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onSubmit={(v) => {
          // POST /api/documents
          router.push(`/legalai/documents/${encodeURIComponent(v.name)}/preview`);
        }}
      />

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={(files) => {
          // POST /api/documents/upload
        }}
      />
    </DocumentsProvider>
  );
}
