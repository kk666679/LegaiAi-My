// components/documents/library/document-list.tsx
"use client";

import * as React from "react";
import type { LegalDocument } from "../types";
import { DocumentRow } from "./document-row";

export interface DocumentListProps {
  documents: LegalDocument[];
  onOpen?: (doc: LegalDocument) => void;
  onFavoriteChange?: (doc: LegalDocument, favorite: boolean) => void;
  onMenu?: (doc: LegalDocument, anchor: HTMLElement) => void;
  showFavorite?: boolean;
}

export function DocumentList({
  documents,
  onOpen,
  onFavoriteChange,
  onMenu,
  showFavorite,
}: DocumentListProps) {
  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <DocumentRow
          key={doc.id}
          document={doc}
          onOpen={onOpen}
          onFavoriteChange={onFavoriteChange}
          onMenu={onMenu}
          showFavorite={showFavorite}
        />
      ))}
    </div>
  );
}
