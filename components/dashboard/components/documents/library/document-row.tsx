// components/documents/library/document-row.tsx
"use client";

import * as React from "react";
import { FileText, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LegalDocument } from "../types";
import { DocumentStatusIndicator } from "../status/document-status-indicator";
import { FavoriteToggle } from "../organization/favorite-toggle";

export interface DocumentRowProps {
  document: LegalDocument;
  onOpen?: (doc: LegalDocument) => void;
  onFavoriteChange?: (doc: LegalDocument, favorite: boolean) => void;
  onMenu?: (doc: LegalDocument, anchor: HTMLElement) => void;
  className?: string;
}

export function DocumentRow({
  document: doc,
  onOpen,
  onFavoriteChange,
  onMenu,
  className,
}: DocumentRowProps) {
  const menuRef = React.useRef<HTMLButtonElement>(null);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(doc)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(doc);
        }
      }}
      className={cn(
        "group flex items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent/30",
        className,
      )}
    >
      <div className="rounded bg-muted p-2 text-muted-foreground">
        <FileText className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{doc.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {doc.type}
          {doc.ownerName ? ` · ${doc.ownerName}` : ""}
        </p>
      </div>
      <DocumentStatusIndicator status={doc.status} compact />
      <span className="hidden w-24 truncate text-xs text-muted-foreground sm:block">
        {new Date(doc.updatedAt).toLocaleDateString()}
      </span>
      <FavoriteToggle
        active={Boolean(doc.favorite)}
        onChange={(value) => onFavoriteChange?.(doc, value)}
      />
      <Button
        ref={menuRef}
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        aria-label={`Actions for ${doc.name}`}
        onClick={(e) => {
          e.stopPropagation();
          if (menuRef.current) onMenu?.(doc, menuRef.current);
        }}
      >
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}
