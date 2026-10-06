"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface RedlineChange { id: string; clauseHeading: string; kind: "insert" | "delete" | "replace"; before?: string; after?: string; author?: string; status: "open" | "accepted" | "rejected"; }
export function ContractRedline({ changes }: { changes: RedlineChange[] }) {
  const open = changes.filter((c) => c.status === "open");
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{changes.length} changes</span><span>·</span><span>{open.length} open</span>
      </div>
      {changes.map((c) => (
        <Card key={c.id} className={cn("space-y-2 p-3", c.status === "open" && "border-amber-500/40")}>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{c.clauseHeading}</p>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] capitalize">{c.kind}</Badge>
              <Badge variant="secondary" className="text-[10px] capitalize">{c.status}</Badge>
            </div>
          </div>
          {c.before ? <div className="rounded bg-destructive/10 p-2 text-xs text-destructive line-through">{c.before}</div> : null}
          {c.after ? <div className="rounded bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-400">{c.after}</div> : null}
          {c.author ? <p className="text-[11px] text-muted-foreground">By {c.author}</p> : null}
        </Card>
      ))}
    </div>
  );
}
