"use client";
import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface DocumentThumbnailSidebarProps { pageCount: number; currentPage: number; onPageSelect?: (page: number) => void; thumbnailUrl?: (page: number) => string; className?: string; }

export function DocumentThumbnailSidebar({ pageCount, currentPage, onPageSelect, thumbnailUrl, className }: DocumentThumbnailSidebarProps) {
  return (
    <aside aria-label="Page thumbnails" className={cn("w-24 shrink-0 border-r border-border/60", className)}>
      <ScrollArea className="h-full">
        <ul className="space-y-2 p-2">
          {Array.from({ length: pageCount }).map((_, i) => {
            const page = i + 1;
            const active = page === currentPage;
            return (
              <li key={page}>
                <button type="button" onClick={() => onPageSelect?.(page)} aria-current={active ? "page" : undefined}
                  className={cn("group relative block w-full overflow-hidden rounded border transition-colors", active ? "border-primary ring-1 ring-primary" : "border-border/60 hover:border-primary/50")}>
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl(page)} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="aspect-[3/4] w-full bg-muted" />
                  )}
                  <span className="absolute bottom-0.5 right-1 rounded bg-background/80 px-1 text-[10px] tabular-nums text-muted-foreground">{page}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </aside>
  );
}
