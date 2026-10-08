"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApprovalRequest, ApprovalStatus } from "../types";

export interface ApprovalStep { id: string; label: string; approverName: string; status: ApprovalStatus; }
export function ApprovalWorkflow({ steps }: { steps: ApprovalStep[] }) {
  return (
    <Card className="p-4">
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.id} className="flex items-start gap-3">
            <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border text-[10px]",
              s.status === "approved" && "border-emerald-500 bg-emerald-500/10 text-emerald-600",
              s.status === "rejected" && "border-destructive bg-destructive/10 text-destructive",
              s.status === "pending" && "border-amber-500 bg-amber-500/10 text-amber-600",
              s.status === "changes-requested" && "border-orange-500 bg-orange-500/10 text-orange-600")}>
              {s.status === "approved" ? <Check className="size-3" /> : s.status === "rejected" ? <X className="size-3" /> : <Circle className="size-3" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.approverName} · <span className="capitalize">{s.status.replace("-", " ")}</span></p>
            </div>
            {i < steps.length - 1 ? <span className="mt-6 block h-6 w-px bg-border" /> : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}
