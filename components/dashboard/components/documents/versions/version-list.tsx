// components/documents/versions/version-list.tsx
"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DocumentVersion } from "../types";

export interface VersionListProps {
  versions: DocumentVersion[];
  onView?: (version: DocumentVersion) => void;
  onCompare?: (version: DocumentVersion) => void;
  onRestore?: (version: DocumentVersion) => void;
  onDownload?: (version: DocumentVersion) => void;
}

export function VersionList({
  versions,
  onView,
  onCompare,
  onRestore,
  onDownload,
}: VersionListProps) {
  return (
    <ol className="space-y-2">
      {versions.map((v) => (
        <li
          key={v.id}
          className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-card p-3"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">
                v{v.versionNumber} — {v.label}
              </p>
              {v.isCurrent ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="size-3" /> Current
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {v.authorName ? `${v.authorName} · ` : ""}
              {new Date(v.createdAt).toLocaleString()}
            </p>
            {v.summary ? (
              <p className="mt-1 text-xs text-muted-foreground">{v.summary}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onView ? (
              <Button size="sm" variant="ghost" onClick={() => onView(v)}>
                View
              </Button>
            ) : null}
            {onCompare ? (
              <Button size="sm" variant="ghost" onClick={() => onCompare(v)}>
                Compare
              </Button>
            ) : null}
            {onRestore && !v.isCurrent ? (
              <Button size="sm" variant="outline" onClick={() => onRestore(v)}>
                Restore
              </Button>
            ) : null}
            {onDownload ? (
              <Button size="sm" variant="ghost" onClick={() => onDownload(v)}>
                Download
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
