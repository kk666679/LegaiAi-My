"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DocumentVersion } from "../types";

export function VersionCard({ version, onSelect }: { version: DocumentVersion; onSelect?: (v: DocumentVersion) => void }) {
  return (
    <Card role="button" tabIndex={0} onClick={() => onSelect?.(version)} onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(version); }}
      className="cursor-pointer p-3 transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">v{version.versionNumber} — {version.label}</p>
        {version.isCurrent ? <Badge variant="secondary" className="text-[10px]">Current</Badge> : null}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {version.authorName ? `${version.authorName} · ` : ""}{new Date(version.createdAt).toLocaleString()}
      </p>
      {version.summary ? <p className="mt-1 text-xs text-muted-foreground">{version.summary}</p> : null}
    </Card>
  );
}
