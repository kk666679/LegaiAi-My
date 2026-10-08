// components/matters/workspace/matter-workspace-header.tsx
"use client";

import * as React from "react";
import { Briefcase, MoreHorizontal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Matter } from "../types";
import { MatterStatusIndicator } from "../status/matter-status-indicator";

export interface MatterWorkspaceHeaderProps {
  matter: Matter;
  actions?: React.ReactNode;
  onFavoriteChange?: (next: boolean) => void;
}

export function MatterWorkspaceHeader({
  matter,
  actions,
  onFavoriteChange,
}: MatterWorkspaceHeaderProps) {
  const team = (matter.team ?? []).slice(0, 4);
  return (
    <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-md bg-muted p-2 text-muted-foreground">
          <Briefcase className="size-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{matter.matterNumber}</span>
            <h1 className="truncate text-base font-semibold">{matter.name}</h1>
            <MatterStatusIndicator status={matter.status} compact />
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {matter.clientName ?? "—"} · {matter.practiceArea}
            {matter.leadName ? ` · Lead: ${matter.leadName}` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden -space-x-1.5 sm:flex">
          {team.map((m) => (
            <Avatar key={m.id} className="size-7 border-2 border-background">
              {m.avatarUrl ? <AvatarImage src={m.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-[10px]">
                {m.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        {onFavoriteChange ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-pressed={Boolean(matter.favorite)}
            aria-label={matter.favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={() => onFavoriteChange(!matter.favorite)}
          >
            <Star className={cn("size-4", matter.favorite && "fill-amber-400 text-amber-400")} />
          </Button>
        ) : null}
        {actions ?? (
          <Button variant="outline" size="icon" className="size-8" aria-label="More actions">
            <MoreHorizontal className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
