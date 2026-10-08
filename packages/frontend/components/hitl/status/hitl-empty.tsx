// components/hitl/status/hitl-empty.tsx
"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HITLEmptyProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  primaryAction?: { label: string; onClick: () => void };
  className?: string;
}

export function HITLEmpty({
  title = "You're all caught up",
  description = "No pending review items in this queue.",
  icon,
  primaryAction,
  className,
}: HITLEmptyProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/70 bg-muted/20 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
        {icon ?? <CheckCircle2 className="size-6" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {primaryAction ? <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button> : null}
    </div>
  );
}