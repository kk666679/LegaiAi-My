"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DiffLine { id: string; kind: "added" | "removed" | "unchanged" | "modified"; text: string; section?: string; }
export function ContractDiff({ lines }: { lines: DiffLine[] }) {
  return (
    <Card className="overflow-hidden">
      <pre className="max-h-[600px] overflow-auto p-4 font-mono text-xs leading-relaxed">
        {lines.map((l) => (
          <div key={l.id} className={cn(
            "block whitespace-pre-wrap rounded px-1",
            l.kind === "added" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            l.kind === "removed" && "bg-destructive/10 text-destructive line-through",
            l.kind === "modified" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
          )}>
            <span className="mr-2 select-none text-muted-foreground">{l.kind === "added" ? "+" : l.kind === "removed" ? "−" : l.kind === "modified" ? "~" : " "}</span>
            {l.text}
          </div>
        ))}
      </pre>
    </Card>
  );
}
