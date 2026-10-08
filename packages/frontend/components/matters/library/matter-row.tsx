// components/matters/library/matter-row.tsx
"use client";

import * as React from "react";
import { AlertTriangle, Briefcase, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Matter } from "../types";
import { MatterStatusIndicator } from "../status/matter-status-indicator";

export interface MatterRowProps {
  matter: Matter;
  onOpen?: (matter: Matter) => void;
  onMenu?: (matter: Matter, anchor: HTMLElement) => void;
  className?: string;
}

export function MatterRow({ matter, onOpen, onMenu, className }: MatterRowProps) {
  const menuRef = React.useRef<HTMLButtonElement>(null);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(matter)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(matter);
        }
      }}
      className={cn(
        "group flex items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent/30",
        className,
      )}
    >
      <div className="rounded bg-muted p-2 text-muted-foreground">
        <Briefcase className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          <span className="text-[11px] text-muted-foreground">{matter.matterNumber}</span>{" "}
          {matter.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {matter.clientName ?? "—"} · {matter.practiceArea}
        </p>
      </div>
      {matter.conflictFlagged ? (
        <AlertTriangle className="size-4 text-destructive" aria-label="Conflict flagged" />
      ) : null}
      <MatterStatusIndicator status={matter.status} compact />
      <span className="hidden w-24 truncate text-xs text-muted-foreground sm:block">
        {new Date(matter.updatedAt).toLocaleDateString()}
      </span>
      {onMenu ? (
        <Button
          ref={menuRef}
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`Actions for ${matter.name}`}
          onClick={(e) => {
            e.stopPropagation();
            if (menuRef.current) onMenu(matter, menuRef.current);
          }}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
