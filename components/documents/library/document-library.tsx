// components/documents/library/document-library.tsx
"use client";

import * as React from "react";
import { LayoutGrid, List, Table2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DocumentViewMode, LegalDocument, DocumentSort, DocumentSortKey } from "../types";
import { DocumentGrid } from "./document-grid";
import { DocumentList } from "./document-list";
import { DocumentTable } from "./document-table";
import { DocumentEmpty } from "../status/document-empty";
import { DocumentLoading } from "../status/document-loading";

export interface DocumentLibraryProps {
  documents: LegalDocument[];
  loading?: boolean;
  view?: DocumentViewMode;
  onViewChange?: (view: DocumentViewMode) => void;
  sort?: DocumentSort;
  onSortChange?: (key: DocumentSortKey) => void;
  onOpen?: (doc: LegalDocument) => void;
  onFavoriteChange?: (doc: LegalDocument, favorite: boolean) => void;
  onMenu?: (doc: LegalDocument, anchor: HTMLElement) => void;
  emptyAction?: { label: string; onClick: () => void };
  emptySecondaryAction?: { label: string; onClick: () => void };
}

export function DocumentLibrary({
  documents,
  loading,
  view = "grid",
  onViewChange,
  sort,
  onSortChange,
  onOpen,
  onFavoriteChange,
  onMenu,
  emptyAction,
  emptySecondaryAction,
}: DocumentLibraryProps) {
  if (loading) return <DocumentLoading variant={view === "table" ? "table" : view} />;

  if (!documents.length) {
    return (
      <DocumentEmpty
        primaryAction={emptyAction}
        secondaryAction={emptySecondaryAction}
      />
    );
  }

  return (
    <div className="space-y-3">
      {onViewChange ? (
        <div className="flex justify-end">
          <Tabs value={view} onValueChange={(v) => onViewChange(v as DocumentViewMode)}>
            <TabsList>
              <TabsTrigger value="grid" aria-label="Grid view">
                <LayoutGrid className="size-4" />
              </TabsTrigger>
              <TabsTrigger value="list" aria-label="List view">
                <List className="size-4" />
              </TabsTrigger>
              <TabsTrigger value="table" aria-label="Table view">
                <Table2 className="size-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : null}

      {view === "grid" ? (
        <DocumentGrid
          documents={documents}
          onOpen={onOpen}
          onFavoriteChange={onFavoriteChange}
          onMenu={onMenu}
        />
      ) : view === "list" ? (
        <DocumentList
          documents={documents}
          onOpen={onOpen}
          onFavoriteChange={onFavoriteChange}
          onMenu={onMenu}
        />
      ) : (
        <DocumentTable
          documents={documents}
          sort={sort}
          onSortChange={onSortChange}
          onOpen={onOpen}
        />
      )}
    </div>
  );
}
