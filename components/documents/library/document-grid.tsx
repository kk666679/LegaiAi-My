// components/documents/library/document-grid.tsx
"use client";

import * as React from "react";
import type { LegalDocument } from "../types";
import { DocumentCard } from "./document-card";

export interface DocumentGridProps {
  documents: LegalDocument[];
  onOpen?: (doc: LegalDocument) => void;
  onFavoriteChange?: (doc: LegalDocument, favorite: boolean) => void;
  onMenu?: (doc: LegalDocument, anchor: HTMLElement) => void;
}

export function DocumentGrid({
  documents,
  onOpen,
  onFavoriteChange,
  onMenu,
}: DocumentGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onOpen={onOpen}
          onFavoriteChange={onFavoriteChange}
          onMenu={onMenu}
        />
      ))}
    </div>
  );
}
