// components/documents/core/documents-context.tsx
"use client";

import * as React from "react";
import type {
  DocumentFilters,
  DocumentSort,
  DocumentsCapabilities,
  LegalDocument,
  DocumentFolder,
} from "../types";

interface DocumentsContextValue {
  documents: LegalDocument[];
  folders: DocumentFolder[];
  filters: DocumentFilters;
  sort: DocumentSort;
  capabilities: DocumentsCapabilities;
  setFilters: (next: Partial<DocumentFilters>) => void;
  resetFilters: () => void;
  setSort: (next: DocumentSort) => void;
  getDocument: (id: string) => LegalDocument | undefined;
  updateDocument: (id: string, patch: Partial<LegalDocument>) => void;
  removeDocument: (id: string) => void;
}

const DocumentsContext = React.createContext<DocumentsContextValue | null>(null);

export interface DocumentsProviderProps {
  children: React.ReactNode;
  documents: LegalDocument[];
  folders?: DocumentFolder[];
  capabilities?: Partial<DocumentsCapabilities>;
  initialFilters?: DocumentFilters;
  initialSort?: DocumentSort;
}

const DEFAULT_CAPS: DocumentsCapabilities = {
  canCreate: true,
  canUpload: true,
  canAnalyse: true,
  canShare: true,
  canDelete: true,
  canApprove: true,
};

const DEFAULT_SORT: DocumentSort = { key: "updatedAt", direction: "desc" };

export function DocumentsProvider({
  children,
  documents: initialDocs,
  folders = [],
  capabilities,
  initialFilters = {},
  initialSort = DEFAULT_SORT,
}: DocumentsProviderProps) {
  const [documents, setDocuments] = React.useState(initialDocs);
  const [filters, setFiltersState] = React.useState<DocumentFilters>(initialFilters);
  const [sort, setSort] = React.useState<DocumentSort>(initialSort);

  React.useEffect(() => setDocuments(initialDocs), [initialDocs]);

  const setFilters = React.useCallback((next: Partial<DocumentFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...next }));
  }, []);

  const resetFilters = React.useCallback(() => setFiltersState({}), []);

  const getDocument = React.useCallback(
    (id: string) => documents.find((d) => d.id === id),
    [documents],
  );

  const updateDocument = React.useCallback(
    (id: string, patch: Partial<LegalDocument>) => {
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      );
    },
    [],
  );

  const removeDocument = React.useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const value = React.useMemo<DocumentsContextValue>(
    () => ({
      documents,
      folders,
      filters,
      sort,
      capabilities: { ...DEFAULT_CAPS, ...capabilities },
      setFilters,
      resetFilters,
      setSort,
      getDocument,
      updateDocument,
      removeDocument,
    }),
    [documents, folders, filters, sort, capabilities, setFilters, resetFilters, getDocument, updateDocument, removeDocument],
  );

  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments(): DocumentsContextValue {
  const ctx = React.useContext(DocumentsContext);
  if (!ctx) {
    throw new Error("useDocuments must be used inside <DocumentsProvider>.");
  }
  return ctx;
}
