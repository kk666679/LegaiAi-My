"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { DocumentLibrary, DocumentSearch, DocumentsHeader, DocumentsProvider, DocumentsShell, useDocumentsList, type DocumentFilters, type DocumentSort, type DocumentViewMode } from "@/components/documents";

export interface ScopedLibraryProps {
  title: string;
  description?: string;
  scope: string;
}

export function ScopedLibrary({ title, description, scope }: ScopedLibraryProps) {
  const router = useRouter();
  const [view, setView] = React.useState<DocumentViewMode>("grid");
  const [filters, setFilters] = React.useState<DocumentFilters>({});
  const [sort, setSort] = React.useState<DocumentSort>({ key: "updatedAt", direction: "desc" });

  const { documents, loading, error } = useDocumentsList({ filters, sort, scope });

  return (
    <DocumentsProvider documents={documents} initialFilters={filters} initialSort={sort}>
      <DocumentsShell header={<DocumentsHeader title={title} description={description} />}>
        <div className="space-y-3 p-4 lg:p-6">
          <DocumentSearch
            filters={filters}
            sort={sort}
            onFiltersChange={(n) => setFilters((f) => ({ ...f, ...n }))}
            onReset={() => setFilters({})}
            onSortChange={setSort}
          />
          <DocumentLibrary
            documents={documents}
            loading={loading}
            view={view}
            onViewChange={setView}
            sort={sort}
            onSortChange={(k) => setSort((s) => ({ ...s, key: k }))}
            onOpen={(d) => router.push(`/lawmate/documents/${d.id}/preview`)}
          />
        </div>
      </DocumentsShell>
    </DocumentsProvider>
  );
}
