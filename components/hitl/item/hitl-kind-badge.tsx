// components/hitl/item/hitl-kind-badge.tsx
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HITLRequestKind } from "../types";

const LABELS: Record<HITLRequestKind, string> = {
  "ai-draft-review": "AI draft",
  "ai-analysis-review": "AI analysis",
  "document-approval": "Doc approval",
  "contract-approval": "Contract approval",
  "matter-opening": "Matter opening",
  "conflict-resolution": "Conflict",
  "high-value-action": "High value",
  "low-confidence-ai": "Low confidence",
  "regulatory-review": "Regulatory",
  escalation: "Escalation",
  custom: "Custom",
};

const TONE: Record<HITLRequestKind, string> = {
  "ai-draft-review": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "ai-analysis-review": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "document-approval": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "contract-approval": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "matter-opening": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "conflict-resolution": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "high-value-action": "bg-destructive/10 text-destructive",
  "low-confidence-ai": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "regulatory-review": "bg-destructive/10 text-destructive",
  escalation: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  custom: "bg-muted text-muted-foreground",
};

export function HITLKindBadge({
  kind,
  className,
}: {
  kind: HITLRequestKind;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent text-[10px] font-medium", TONE[kind], className)}
    >
      {LABELS[kind]}
    </Badge>
  );
}

export { LABELS as HITL_KIND_LABELS };