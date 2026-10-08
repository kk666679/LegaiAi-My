"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PlaybookPosition } from "../types";
import { cn } from "@/lib/utils";

export interface NegotiationPositionItem {
  id: string;
  clauseHeading: string;
  ours: string;
  theirs: string;
  position: PlaybookPosition;
  agreed?: boolean;
}

const TONE: Record<PlaybookPosition, string> = {
  preferred: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  acceptable: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  fallback: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "walk-away": "bg-destructive/10 text-destructive",
};

export function NegotiationPositions({ items }: { items: NegotiationPositionItem[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No positions tracked.</p>;
  return (
    <div className="space-y-2">
      {items.map((p) => (
        <Card key={p.id} className="p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{p.clauseHeading}</p>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={cn("border-transparent text-[10px] capitalize", TONE[p.position])}>{p.position.replace("-", " ")}</Badge>
              {p.agreed ? <Badge variant="secondary" className="text-[10px]">Agreed</Badge> : null}
            </div>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
            <div><p className="text-[10px] uppercase text-muted-foreground">Our position</p><p className="mt-0.5">{p.ours}</p></div>
            <div><p className="text-[10px] uppercase text-muted-foreground">Their position</p><p className="mt-0.5">{p.theirs}</p></div>
          </div>
        </Card>
      ))}
    </div>
  );
}
