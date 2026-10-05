"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileCheck2, FileText, ShieldCheck, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDocumentLibrary, type DocumentFilters, type DocumentListItem } from "@/hooks/useDocuments";
import type { DocumentViewMode, LegalDocument } from "./types";
import { DocumentCollections } from "./DocumentCollections";
import { DocumentLibrary } from "./library/document-library";
import { DocumentSearchBar } from "./search/document-search-bar";
import { DocumentError } from "./status/document-error";
import { NewDocumentDialog } from "@/components/lawmate/NewDocumentDialog";
import { UploadDialog } from "@/components/lawmate/UploadDialog";
import { useDebounce } from "@/hooks/useDebounce";

type Collection = "all" | "recent" | "contracts" | "drafts" | "archived";

const statusLabels: Record<string, string> = {
  draft: "Draft",
  review: "In review",
  approved: "Approved",
  archived: "Archived",
};

const typeLabels: Record<string, string> = {
  CONTRACT: "Contract",
  AGREEMENT: "Agreement",
  PLEADING: "Pleading",
  MOTION: "Motion",
  BRIEF: "Brief",
  MEMORANDUM: "Memorandum",
  LETTER: "Letter",
  OTHER: "Document",
};

function isLibraryStatus(status: string): status is LegalDocument["status"] {
  return status === "draft" || status === "review" || status === "approved" || status === "archived";
}

function toLibraryDocument(
  document: DocumentListItem,
  clientName?: string,
): LegalDocument {
  if (!isLibraryStatus(document.status)) {
    throw new Error(`Document ${document.id} has an unsupported status: ${document.status}`);
  }

  return {
    id: document.id,
    name: document.title,
    type: document.docType,
    status: document.status,
    ownerName: clientName,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    tags: document.tags.map((label, index) => ({
      id: `${document.id}-tag-${index}`,
      label,
    })),
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start gap-3 pt-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon aria-hidden />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DocumentsHub({
  clients = [],
  onCreated,
}: {
  clients?: { id: string; name: string }[];
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<DocumentFilters>({
    search: "",
    status: "all",
    docType: "all",
    court: "all",
    clientId: "all",
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  const [search, setSearch] = useState("");
  const [view, setView] = useState<DocumentViewMode>("list");
  const [collection, setCollection] = useState<Collection>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const query = useDocumentLibrary({ ...filters, search: debouncedSearch });
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const availableClients = clients.length > 0 ? clients : query.clients;

  const collectionFilters = (next: Collection) => {
    setCollection(next);
    setFilters((current) => ({
      ...current,
      status: next === "drafts" ? "draft" : next === "archived" ? "archived" : "all",
      docType: "all",
      sortBy: next === "recent" ? "updatedAt" : current.sortBy,
      sortOrder: next === "recent" ? "desc" : current.sortOrder,
    }));
  };

  const visibleDocuments = useMemo(() => {
    const documents = query.documents;
    if (collection === "contracts") {
      return documents.filter((document) =>
        ["CONTRACT", "AGREEMENT"].includes(document.docType),
      );
    }
    if (collection === "recent") return documents.slice(0, 10);
    return documents;
  }, [collection, query.documents]);

  const libraryDocuments = useMemo(() => {
    if (visibleDocuments.some((document) => !isLibraryStatus(document.status))) {
      return [];
    }
    return visibleDocuments.map((document) =>
      toLibraryDocument(
        document,
        document.clientId ? query.clientNames.get(document.clientId) : undefined,
      ),
    );
  }, [query.clientNames, visibleDocuments]);
  const stats = query.stats;
  const unsupportedDocument = query.documents.find(
    (document) => !isLibraryStatus(document.status),
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Legal workspace
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Create, understand, review, and govern your legal documents.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            Upload
          </Button>
          <NewDocumentDialog
            clients={availableClients}
            onCreated={(id) => {
              onCreated?.(id);
              router.push(`/legalai/documents/${id}`);
            }}
            trigger={
              <Button ref={createButtonRef} size="sm">
                New document
              </Button>
            }
          />
        </div>
      </div>

      {query.statsError ? (
        <DocumentError
          title="Could not load document statistics"
          description={query.statsError.message}
          onRetry={query.retry}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={FileText} label="All documents" value={stats?.total ?? 0} />
          <StatCard icon={Clock3} label="Recently updated" value={stats?.recentActivity ?? 0} />
          <StatCard icon={FileCheck2} label="Needs review" value={stats?.byStatus?.review ?? 0} />
          <StatCard icon={ShieldCheck} label="Approved" value={stats?.byStatus?.approved ?? 0} />
        </div>
      )}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
        <DocumentCollections
          active={collection}
          onSelect={(id) => {
            if (id === "all" || id === "recent" || id === "contracts" || id === "drafts" || id === "archived") collectionFilters(id);
          }}
          disabledCollections={["favorites", "shared"]}
          className="h-fit"
        />

        <Card className="min-w-0">
          <CardContent className="flex min-w-0 flex-col gap-4 pt-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <DocumentSearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search documents, cases, or clients…"
                className="min-w-0 flex-1"
              />
              <Select
                value={filters.status}
                onValueChange={(status) =>
                  setFilters((current) => ({
                    ...current,
                    status: status as DocumentFilters["status"],
                  }))
                }
              >
                <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <SelectItem key={status} value={status}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.docType}
                onValueChange={(docType) =>
                  setFilters((current) => ({
                    ...current,
                    docType: docType as DocumentFilters["docType"],
                  }))
                }
              >
                <SelectTrigger className="w-full sm:w-44" aria-label="Filter by document type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.entries(typeLabels).map(([type, label]) => (
                    <SelectItem key={type} value={type}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {query.error ? (
              <DocumentError
                title="Could not load documents"
                description={query.error.message}
                onRetry={query.retry}
              />
            ) : unsupportedDocument ? (
              <DocumentError
                title="Could not display a document"
                description={`Document ${unsupportedDocument.id} has an unsupported status: ${unsupportedDocument.status}`}
                onRetry={query.retry}
              />
            ) : (
              <DocumentLibrary
                documents={libraryDocuments}
                loading={query.isLoading}
                view={view}
                onViewChange={setView}
                onOpen={(document) => router.push(`/legalai/documents/${document.id}`)}
                emptyAction={{
                  label: "Create document",
                  onClick: () => createButtonRef.current?.click(),
                }}
                emptySecondaryAction={{
                  label: "Upload document",
                  onClick: () => setUploadOpen(true),
                }}
              />
            )}

            {query.hasMore ? (
              <Button
                variant="outline"
                onClick={query.loadMore}
                disabled={query.isFetching}
              >
                {query.isFetching ? "Loading…" : "Load more documents"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Button variant="outline" asChild>
          <Link href="/legalai/draft">Draft with AI</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/legalai/analysis">Analyse a document</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/legalai/contracts">Review contracts</Link>
        </Button>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}

export default DocumentsHub;
