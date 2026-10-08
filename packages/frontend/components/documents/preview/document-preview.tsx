// components/documents/preview/document-preview.tsx
"use client";

import * as React from "react";
import type { LegalDocument } from "../types";
import { DocumentViewer } from "./document-viewer";
import { DocumentToolbar } from "./document-toolbar";

export interface DocumentPreviewProps {
  document: LegalDocument;
  page?: number;
  onPageChange?: (page: number) => void;
  onDownload?: () => void;
  onPrint?: () => void;
  onSearch?: () => void;
  onFullscreen?: () => void;
}

export function DocumentPreview({
  document: doc,
  page = 1,
  onPageChange,
  onDownload,
  onPrint,
  onSearch,
  onFullscreen,
}: DocumentPreviewProps) {
  const [zoom, setZoom] = React.useState(1);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 p-2">
        <p className="truncate text-sm font-medium">{doc.name}</p>
        <DocumentToolbar
          page={page}
          pageCount={doc.pageCount}
          zoom={zoom}
          onPageChange={onPageChange}
          onZoomChange={setZoom}
          onDownload={onDownload}
          onPrint={onPrint}
          onSearch={onSearch}
          onFullscreen={onFullscreen}
        />
      </div>
      <div className="min-h-0 flex-1 p-3">
        <DocumentViewer
          src={doc.url}
          mimeType={doc.type === "PDF" ? "application/pdf" : undefined}
          page={page}
          zoom={zoom}
        />
      </div>
    </div>
  );
}
