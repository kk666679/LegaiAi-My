// components/hitl/escalation/hitl-escalation-badge.tsx
"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface HITLEscalationBadgeProps {
  level: number;
  className?: string;
}

export function HITLEscalationBadge({ level, className }: HITLEscalationBadgeProps) {
  if (!level) return null;
  const tone =
    level >= 3
      ? "bg-destructive/10 text-destructive"
      : level === 2
      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
      : "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent gap-1 text-[10px] font-medium", tone, className)}
    >
      <ArrowUpRight className="size-3" /> L{level}
    </Badge>
  );
}