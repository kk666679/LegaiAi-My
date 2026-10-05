// components/matters/documents/matter-documents.tsx
"use client";

import * as React from "react";
import { ExternalLink, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Matter } from "../types";

export interface MatterDocumentsProps {
  matterId: string;
  documents: Array<{ id: string; name: string; type: string; updatedAt: string }>;
  onAdd?: () => void;
  onOpen?: (documentId: string) => void;
}

export function MatterDocuments({ documents, onAdd, onOpen }: MatterDocumentsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{documents.length} documents</p>
        {onAdd ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onAdd}>
            <Plus className="size-3.5" /> Add document
          </Button>
        ) : null}
      </div>
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents linked to this matter yet.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <Card
              key={d.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpen?.(d.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onOpen?.(d.id);
              }}
              className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:border-primary/40"
            >
              <div className="rounded bg-muted p-2 text-muted-foreground">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="text-xs text-muted-foreground">
                  {d.type} · Updated {new Date(d.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
