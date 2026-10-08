// components/documents/metadata/document-metadata.tsx
"use client";

import * as React from "react";
import type { LegalDocument } from "../types";
import { DocumentStatus } from "./document-status";
import { DocumentTags } from "./document-tags";

export interface DocumentMetadataProps {
  document: LegalDocument;
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-right text-sm">{value}</dd>
    </div>
  );
}

export function DocumentMetadata({ document: doc }: DocumentMetadataProps) {
  return (
    <div className="space-y-2">
      <dl className="divide-y divide-border/60">
        <Row label="Type" value={doc.type} />
        {doc.category ? <Row label="Category" value={doc.category} /> : null}
        <Row label="Status" value={<DocumentStatus status={doc.status} compact />} />
        {doc.ownerName ? <Row label="Owner" value={doc.ownerName} /> : null}
        {doc.language ? <Row label="Language" value={doc.language} /> : null}
        {doc.jurisdiction ? <Row label="Jurisdiction" value={doc.jurisdiction} /> : null}
        {doc.pageCount ? <Row label="Pages" value={doc.pageCount} /> : null}
        {doc.size ? (
          <Row label="Size" value={`${(doc.size / 1024 / 1024).toFixed(1)} MB`} />
        ) : null}
        <Row label="Created" value={new Date(doc.createdAt).toLocaleString()} />
        <Row label="Updated" value={new Date(doc.updatedAt).toLocaleString()} />
      </dl>
      {doc.tags?.length ? (
        <div className="space-y-1.5 pt-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tags
          </p>
          <DocumentTags tags={doc.tags} />
        </div>
      ) : null}
    </div>
  );
}
