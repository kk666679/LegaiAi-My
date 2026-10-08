// components/documents/overview/recent-documents.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import type { LegalDocument } from "../types";
import { DocumentList } from "../library/document-list";

export interface RecentDocumentsProps {
  documents: LegalDocument[];
  onOpen?: (doc: LegalDocument) => void;
  onViewAll?: () => void;
}

export function RecentDocuments({
  documents,
  onOpen,
  onViewAll,
}: RecentDocumentsProps) {
  return (
    <section aria-labelledby="recent-documents-heading" className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 id="recent-documents-heading" className="text-sm font-medium">
          Recent
        </h2>
        {onViewAll ? (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
          </Button>
        ) : null}
      </div>
      <DocumentList
        documents={documents.slice(0, 5)}
        onOpen={onOpen}
      />
    </section>
  );
}
