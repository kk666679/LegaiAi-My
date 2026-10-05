"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface DiffLine { id: string; kind: "added" | "removed" | "unchanged"; text: string; }
export function ComparisonDiff({ lines }: { lines: DiffLine[] }) {
  return (
    <pre className="rounded-md border border-border/60 bg-muted/20 p-3 font-mono text-xs leading-relaxed">
      {lines.map((l) => (
        <div key={l.id} className={cn(
          "block",
          l.kind === "added" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
          l.kind === "removed" && "bg-destructive/10 text-destructive",
        )}>
          <span className="mr-2 select-none text-muted-foreground">{l.kind === "added" ? "+" : l.kind === "removed" ? "−" : " "}</span>
          {l.text}
        </div>
      ))}
    </pre>
  );
}
