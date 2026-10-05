// components/automation/core/automation-header.tsx
"use client";

import * as React from "react";
import { Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface AutomationHeaderProps {
  workflowName: string;
  breadcrumbs?: React.ReactNode;
  savedLabel?: string;
  isDirty?: boolean;
  actions?: React.ReactNode;
  userInitials?: string;
  className?: string;
}

export function AutomationHeader({
  workflowName,
  breadcrumbs,
  savedLabel = "Saved",
  isDirty,
  actions,
  userInitials = "AM",
  className,
}: AutomationHeaderProps) {
  return (
    <header className={cn("flex items-center gap-3 px-4 py-2.5", className)}>
      <div className="flex min-w-0 items-center gap-2">
        <div className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
          <ShieldCheck className="size-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Automation
          </p>
          <p className="truncate text-sm font-semibold">{workflowName}</p>
        </div>
        {breadcrumbs}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="hidden gap-1 border-transparent bg-muted text-[10px] sm:inline-flex">
          {isDirty ? (
            <>
              <span className="size-1.5 rounded-full bg-amber-500" aria-hidden /> Unsaved
            </>
          ) : (
            <>
              <Check className="size-3" /> {savedLabel}
            </>
          )}
        </Badge>
        {actions}
        <Button size="icon" variant="secondary" className="size-7 rounded-full text-[11px] font-semibold">
          {userInitials}
        </Button>
      </div>
    </header>
  );
}
