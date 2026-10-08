// components/documents/library/document-card.tsx
"use client";

import * as React from "react";
import { FileText, MoreHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LegalDocument } from "../types";
import { DocumentStatusIndicator } from "../status/document-status-indicator";
import { FavoriteToggle } from "../organization/favorite-toggle";

export interface DocumentCardProps {
  document: LegalDocument;
  onOpen?: (doc: LegalDocument) => void;
  onFavoriteChange?: (doc: LegalDocument, favorite: boolean) => void;
  onMenu?: (doc: LegalDocument, anchor: HTMLElement) => void;
  showFavorite?: boolean;
  className?: string;
}

export function DocumentCard({
  document: doc,
  onOpen,
  onFavoriteChange,
  onMenu,
  showFavorite = false,
  className,
}: DocumentCardProps) {
  const menuRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Card
      className={cn(
        "group relative flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:border-primary/40 hover:bg-accent/30",
        className,
      )}
      onClick={() => onOpen?.(doc)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(doc);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <FileText className="size-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{doc.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {doc.type}
              {doc.pageCount ? ` · ${doc.pageCount} pages` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {showFavorite && onFavoriteChange ? (
            <FavoriteToggle
              active={Boolean(doc.favorite)}
              onChange={(value) => onFavoriteChange(doc, value)}
            />
          ) : null}
          {onMenu ? (
            <Button
              ref={menuRef}
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`Actions for ${doc.name}`}
              onClick={(e) => {
                e.stopPropagation();
                if (menuRef.current) onMenu(doc, menuRef.current);
              }}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {doc.thumbnailUrl ? (
        <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={doc.thumbnailUrl}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 pt-1">
        <DocumentStatusIndicator status={doc.status} compact />
        <p className="truncate text-xs text-muted-foreground">
          {new Date(doc.updatedAt).toLocaleDateString()}
        </p>
      </div>

      {doc.tags?.length ? (
        <div className="flex flex-wrap gap-1">
          {doc.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag.label}
            </span>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
