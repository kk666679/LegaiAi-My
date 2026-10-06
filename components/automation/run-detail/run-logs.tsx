"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface RunLogLine { id: string; timestamp: string; level: "info" | "warn" | "error"; message: string; }
export function RunLogs({ lines }: { lines: RunLogLine[] }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { ref.current?.scrollTo(0, ref.current.scrollHeight); }, [lines.length]);
  return (
    <div ref={ref} className="max-h-96 overflow-y-auto rounded-md border border-border/60 bg-muted/20 p-2 font-mono text-[11px]">
      {lines.map((l) => (
        <div key={l.id} className={cn("flex gap-2", l.level === "error" && "text-destructive", l.level === "warn" && "text-amber-600 dark:text-amber-400")}>
          <span className="shrink-0 text-muted-foreground">{new Date(l.timestamp).toLocaleTimeString()}</span>
          <span className="shrink-0 uppercase">{l.level}</span>
          <span className="flex-1">{l.message}</span>
        </div>
      ))}
    </div>
  );
}
