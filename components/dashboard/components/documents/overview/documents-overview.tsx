// components/documents/overview/documents-overview.tsx
"use client";

import * as React from "react";
import type { DocumentActivityEvent, DocumentsStats, LegalDocument } from "../types";
import { DocumentsSummary } from "./documents-summary";
import { DocumentsQuickActions } from "./documents-quick-actions";
import { RecentDocuments } from "./recent-documents";
import { DocumentActivityOverview } from "./document-activity";

export interface DocumentsOverviewProps {
  stats: DocumentsStats;
  recent: LegalDocument[];
  favorites?: LegalDocument[];
  activity: DocumentActivityEvent[];
  onCreate?: () => void;
  onUpload?: () => void;
  onAnalyse?: () => void;
  onContracts?: () => void;
  onDraftingStudio?: () => void;
  onOpenDocument?: (doc: LegalDocument) => void;
  onViewAll?: () => void;
}

export function DocumentsOverview({
  stats,
  recent,
  activity,
  onCreate,
  onUpload,
  onAnalyse,
  onContracts,
  onDraftingStudio,
  onOpenDocument,
  onViewAll,
}: DocumentsOverviewProps) {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <DocumentsSummary stats={stats} />
      <DocumentsQuickActions
        onCreate={onCreate}
        onUpload={onUpload}
        onAnalyse={onAnalyse}
        onContracts={onContracts}
        onDraftingStudio={onDraftingStudio}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentDocuments
            documents={recent}
            onOpen={onOpenDocument}
            onViewAll={onViewAll}
          />
        </div>
        <DocumentActivityOverview events={activity} />
      </div>
    </div>
  );
}
