"use client";
// app/legalai/research/_components/authority-list.tsx
import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AuthorityKindBadge, AuthorityCourtBadge } from "./authority-badges";
import type { Authority } from "./types";

export interface AuthorityListProps {
  authorities: Authority[];
  onOpen: (a: Authority) => void;
  onSave: (a: Authority) => void;
  onCompare?: (a: Authority) => void;
  selectedIds?: string[];
  className?: string;
}

export function AuthorityList({
  authorities,
  onOpen,
  onSave,
  onCompare,
  selectedIds = [],
  className,
}: AuthorityListProps) {
  return (
    <ScrollArea className={cn("h-[60vh]", className)}>
      <div className="space-y-2">
        {authorities.map((a) => {
          const selected = selectedIds.includes(a.id);
          return (
            <article
              key={a.id}
              className="rounded-lg border border-border/60 p-3 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AuthorityKindBadge kind={a.kind} />
                    {a.court ? <AuthorityCourtBadge court={a.court} /> : null}
                    <span className="text-[10px] text-muted-foreground">{a.year}</span>
                  </div>
                  <h3 className="mt-1 truncate text-sm font-medium">{a.title}</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.summary}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label="Save authority"
                    onClick={() => onSave(a)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    ★
                  </button>
                  {onCompare ? (
                    <button
                      type="button"
                      aria-label="Compare"
                      onClick={() => onCompare(a)}
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[10px]",
                        selected ? "border-primary/60 bg-primary/10 text-primary" : "border-border/60",
                      )}
                    >
                      {selected ? "Selected" : "Compare"}
                    </button>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpen(a)}
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                Open →
              </button>
            </article>
          );
        })}
      </div>
    </ScrollArea>
  );
}