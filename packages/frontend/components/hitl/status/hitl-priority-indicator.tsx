// components/hitl/status/hitl-priority-indicator.tsx
"use client";

import * as React from "react";
import { AlertOctagon, ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HITLPriority } from "../types";

const TONE: Record<HITLPriority, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  urgent: "bg-destructive/10 text-destructive",
};

const ICON: Record<HITLPriority, React.ReactNode> = {
  low: <ArrowDown className="size-3" />,
  normal: <ArrowRight className="size-3" />,
  high: <ArrowUp className="size-3" />,
  urgent: <AlertOctagon className="size-3" />,
};

export interface HITLPriorityIndicatorProps {
  priority: HITLPriority;
  compact?: boolean;
  className?: string;
}

export function HITLPriorityIndicator({
  priority,
  compact,
  className,
}: HITLPriorityIndicatorProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent gap-1 font-medium capitalize",
        TONE[priority],
        compact && "px-1.5 py-0 text-[10px]",
        className,
      )}
    >
      {ICON[priority]}
      {priority}
    </Badge>
  );
}