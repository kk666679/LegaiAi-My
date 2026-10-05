"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import type { DocumentCreationFormValues } from "./document-creation-form";

export interface DocumentCreationPreviewProps { values: DocumentCreationFormValues; templateLabel?: string; typeLabel?: string; className?: string; }

export function DocumentCreationPreview({ values, templateLabel, typeLabel, className }: DocumentCreationPreviewProps) {
  return (
    <Card className={className}>
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-muted p-2 text-muted-foreground"><FileText className="size-4" /></div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{values.name || "Untitled document"}</p>
            <p className="text-xs text-muted-foreground">{typeLabel ?? "Document"}{templateLabel ? ` · ${templateLabel}` : ""}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {values.category ? <Badge variant="secondary">{values.category}</Badge> : null}
          {values.jurisdiction ? <Badge variant="outline">{values.jurisdiction}</Badge> : null}
          {values.language ? <Badge variant="outline">{values.language}</Badge> : null}
        </div>
        {values.description ? <p className="text-xs text-muted-foreground">{values.description}</p> : null}
      </div>
    </Card>
  );
}
