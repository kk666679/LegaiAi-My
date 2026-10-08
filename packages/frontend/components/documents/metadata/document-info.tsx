"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import type { LegalDocument } from "../types";
import { DocumentMetadata } from "./document-metadata";

export function DocumentInfo({ document, className }: { document: LegalDocument; className?: string }) {
  return (
    <Card className={className}>
      <div className="p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Document info</p>
        <DocumentMetadata document={document} />
      </div>
    </Card>
  );
}
