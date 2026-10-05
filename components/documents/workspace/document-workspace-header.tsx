"use client";
import * as React from "react";
import { FileText, MoreHorizontal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LegalDocument } from "../types";
import { DocumentStatusIndicator } from "../status/document-status-indicator";

export interface DocumentWorkspaceHeaderProps { document: LegalDocument; collaborators?: Array<{ id: string; name: string; avatarUrl?: string }>; actions?: React.ReactNode; onFavoriteChange?: (next: boolean) => void; }

export function DocumentWorkspaceHeader({ document: doc, collaborators = [], actions, onFavoriteChange }: DocumentWorkspaceHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-md bg-muted p-2 text-muted-foreground"><FileText className="size-4" /></div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-base font-semibold">{doc.name}</h1>
            <DocumentStatusIndicator status={doc.status} compact />
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {doc.type}{doc.category ? ` · ${doc.category}` : ""}{doc.ownerName ? ` · ${doc.ownerName}` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {collaborators.length > 0 ? (
          <div className="hidden -space-x-1.5 sm:flex">
            {collaborators.slice(0, 4).map((c) => (
              <Avatar key={c.id} className="size-7 border-2 border-background">
                {c.avatarUrl ? <AvatarImage src={c.avatarUrl} alt="" /> : null}
                <AvatarFallback className="text-[10px]">{c.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        ) : null}
        {onFavoriteChange ? (
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-pressed={Boolean(doc.favorite)} aria-label={doc.favorite ? "Unfavorite" : "Favorite"} onClick={() => onFavoriteChange(!doc.favorite)}>
            <Star className={cn("size-4", doc.favorite && "fill-amber-400 text-amber-400")} />
          </Button>
        ) : null}
        {actions ?? <Button variant="outline" size="icon" className="size-8" aria-label="More"><MoreHorizontal className="size-4" /></Button>}
      </div>
    </header>
  );
}
