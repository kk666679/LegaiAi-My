"use client";
// app/lawmate/research/_components/session-card.tsx
import * as React from "react";
import { ArrowRight, Bookmark, BookmarkCheck, FileText, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResearchSession } from "./types";
import { ResearchStatusBadge } from "./authority-badges";

export interface SessionCardProps {
  session: ResearchSession;
  onOpen?: (s: ResearchSession) => void;
  onToggleSave?: (s: ResearchSession) => void;
  className?: string;
  variant?: "card" | "row";
}

export function SessionCard({ session, onOpen, onToggleSave, className, variant = "card" }: SessionCardProps) {
  if (variant === "row") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen?.(session)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen?.(session);
          }
        }}
        className={cn(
          "group flex items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2.5 transition-colors hover:border-primary/40",
          className,
        )}
      >
        <div className="rounded bg-muted p-2 text-muted-foreground">
          <Sparkles className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{session.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {session.authorityCount} sources · {session.findingCount} findings
            {session.matterName ? ` · ${session.matterName}` : ""}
          </p>
        </div>
        <ResearchStatusBadge status={session.status} compact />
        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    );
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(session)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(session);
        }
      }}
      className={cn(
        "group flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{session.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{session.query.text}</p>
        </div>
        {onToggleSave ? (
          <Button
            size="icon"
            variant="ghost"
            className="size-7 shrink-0 text-muted-foreground"
            aria-label={session.saved ? "Unsave" : "Save"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(session);
            }}
          >
            {session.saved ? (
              <BookmarkCheck className="size-3.5 text-primary" />
            ) : (
              <Bookmark className="size-3.5" />
            )}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ResearchStatusBadge status={session.status} compact />
        <span className="text-[11px] text-muted-foreground">
          {session.authorityCount} sources · {session.findingCount} findings
        </span>
      </div>

      {session.matterName ? (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <FileText className="size-3" />
          <span className="truncate">{session.matterName}</span>
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
        <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
        <div className="flex flex-wrap gap-1">
          {session.tags?.slice(0, 2).map((t) => (
            <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
