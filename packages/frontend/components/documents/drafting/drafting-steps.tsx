"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DraftingStep { id: string; label: string; status: "pending" | "current" | "done"; }
export function DraftingSteps({ steps, className }: { steps: DraftingStep[]; className?: string }) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs", className)}>
      {steps.map((s, i) => (
        <li key={s.id} className="flex items-center gap-1.5">
          <span className={cn("grid size-4 place-items-center rounded-full border text-[9px]",
            s.status === "done" && "border-emerald-500 bg-emerald-500/10 text-emerald-600",
            s.status === "current" && "border-primary bg-primary/10 text-primary",
            s.status === "pending" && "border-muted text-muted-foreground")}>
            {s.status === "done" ? <Check className="size-3" /> : i + 1}
          </span>
          <span className={cn(s.status === "current" && "font-medium text-foreground", s.status !== "current" && "text-muted-foreground")}>{s.label}</span>
          {i < steps.length - 1 ? <span className="text-muted-foreground/40">›</span> : null}
        </li>
      ))}
    </ol>
  );
}
