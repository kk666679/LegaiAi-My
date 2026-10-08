// components/matters/library/matter-card.tsx
"use client";

import * as React from "react";
import { AlertTriangle, Briefcase, MoreHorizontal, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Matter } from "../types";
import { MatterStatusIndicator } from "../status/matter-status-indicator";

export interface MatterCardProps {
  matter: Matter;
  onOpen?: (matter: Matter) => void;
  onFavoriteChange?: (matter: Matter, next: boolean) => void;
  onMenu?: (matter: Matter, anchor: HTMLElement) => void;
  className?: string;
}

export function MatterCard({
  matter,
  onOpen,
  onFavoriteChange,
  onMenu,
  className,
}: MatterCardProps) {
  const menuRef = React.useRef<HTMLButtonElement>(null);
  const team = (matter.team ?? []).slice(0, 3);

  return (
    <Card
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
        "group relative flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:border-primary/40 hover:bg-accent/30",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Briefcase className="size-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {matter.matterNumber}
            </p>
            <p className="truncate text-sm font-medium">{matter.name}</p>
            {matter.clientName ? (
              <p className="truncate text-xs text-muted-foreground">{matter.clientName}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onFavoriteChange ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              aria-pressed={Boolean(matter.favorite)}
              aria-label={matter.favorite ? "Remove from favorites" : "Add to favorites"}
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteChange(matter, !matter.favorite);
              }}
            >
              <Star className={cn("size-4", matter.favorite && "fill-amber-400 text-amber-400")} />
            </Button>
          ) : null}
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
      </div>

      {matter.description ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">{matter.description}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <MatterStatusIndicator status={matter.status} compact />
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {matter.practiceArea}
        </span>
        {matter.conflictFlagged ? (
          <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive">
            <AlertTriangle className="size-2.5" /> Conflict
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex -space-x-1.5">
          {team.map((member) => (
            <Avatar key={member.id} className="size-6 border-2 border-background">
              {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-[9px]">
                {member.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {(matter.team?.length ?? 0) > 3 ? (
            <span className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] text-muted-foreground">
              +{(matter.team?.length ?? 0) - 3}
            </span>
          ) : null}
        </div>
        {matter.nextDeadlineAt ? (
          <p className="text-[11px] text-muted-foreground">
            Next: {new Date(matter.nextDeadlineAt).toLocaleDateString()}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
