"use client";
import * as React from "react";
import { Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DocumentCollection { id: string; name: string; description?: string; count?: number; color?: string; }
export interface DocumentCollectionsProps { collections: DocumentCollection[]; onSelect?: (id: string) => void; className?: string; }

export function DocumentCollections({ collections, onSelect, className }: DocumentCollectionsProps) {
  return (
    <div className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {collections.map((c) => (
        <Card key={c.id} role="button" tabIndex={0} onClick={() => onSelect?.(c.id)}
          onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(c.id); }}
          className="flex cursor-pointer items-start gap-3 p-3 transition-colors hover:border-primary/40">
          <span className="rounded-md bg-muted p-2 text-muted-foreground" style={c.color ? { background: c.color } : undefined}><Layers className="size-4" /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{c.name}</span>
            {c.description ? <span className="block text-xs text-muted-foreground">{c.description}</span> : null}
          </span>
          {typeof c.count === "number" ? <span className="text-xs tabular-nums text-muted-foreground">{c.count}</span> : null}
        </Card>
      ))}
    </div>
  );
}
