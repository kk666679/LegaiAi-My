"use client";

import { ArgumentCard } from "./argument-card";
import { cn } from "@/lib/utils";
import type { DebateArgument, DebateSide } from "@/types/debate";

export interface ArgumentListProps {
  arguments: DebateArgument[];
  onAction?: (argument: DebateArgument, action: "counter" | "rebut" | "challenge") => void;
  side?: DebateSide | "all";
  className?: string;
}

function matchesSide(argument: DebateArgument, side: ArgumentListProps["side"]) {
  if (side === "all" || side === undefined) return true;
  return argument.side === side;
}

export function ArgumentList({ arguments: args, onAction, side, className }: ArgumentListProps) {
  const filtered = args.filter((a) => matchesSide(a, side));
  const ordered = [...filtered].sort((a, b) => {
    const aTime = a.timestamp ? Date.parse(a.timestamp) : 0;
    const bTime = b.timestamp ? Date.parse(b.timestamp) : 0;
    return aTime - bTime;
  });

  return (
    <div className={cn("space-y-3", className)}>
      {ordered.map((argument) => (
        <ArgumentCard key={argument.id} argument={argument} onAction={onAction} />
      ))}
      {ordered.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">No arguments yet.</p>
      ) : null}
    </div>
  );
}
