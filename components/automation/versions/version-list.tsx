// components/automation/versions/version-list.tsx
"use client";

import * as React from "react";
import { CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkflowVersion } from "../types";

export interface VersionListProps {
  versions: WorkflowVersion[];
  onView?: (v: WorkflowVersion) => void;
  onRestore?: (v: WorkflowVersion) => void;
  onDownload?: (v: WorkflowVersion) => void;
}

export function VersionList({ versions, onView, onRestore, onDownload }: VersionListProps) {
  return (
    <ol className="space-y-2 p-3">
      {versions.map((v) => (
        <li
          key={v.id}
          className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-card p-2.5"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">v{v.versionNumber}</p>
              {v.isCurrent ? (
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <CheckCircle2 className="size-3" /> Current
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {v.authorName ? `${v.authorName} · ` : ""}
              {new Date(v.createdAt).toLocaleString()}
            </p>
            {v.summary ? <p className="mt-0.5 text-xs text-muted-foreground">{v.summary}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onView ? (
              <Button size="sm" variant="ghost" onClick={() => onView(v)}>
                View
              </Button>
            ) : null}
            {onRestore && !v.isCurrent ? (
              <Button size="sm" variant="outline" onClick={() => onRestore(v)}>
                Restore
              </Button>
            ) : null}
            {onDownload ? (
              <Button size="icon" variant="ghost" className="size-8" aria-label="Download" onClick={() => onDownload(v)}>
                <Download className="size-3.5" />
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
