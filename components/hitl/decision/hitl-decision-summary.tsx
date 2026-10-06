// components/hitl/decisions/hitl-decision-summary.tsx
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Check, ChevronRight, Clock, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HITLDecisionKind } from "../types";

const TONE: Record<HITLDecisionKind, string> = {
  approve: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  reject: "bg-destructive/10 text-destructive",
  "request-changes": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  escalate: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  defer: "bg-muted text-muted-foreground",
};

const ICON: Record<HITLDecisionKind, React.ReactNode> = {
  approve: <Check className="size-3" />,
  reject: <X className="size-3" />,
  "request-changes": <Send className="size-3" />,
  escalate: <ChevronRight className="size-3" />,
  defer: <Clock className="size-3" />,
};

export interface HITLDecisionSummaryProps {
  kind: HITLDecisionKind;
  actorName: string;
  decidedAt: string;
  comments?: string;
}

export function HITLDecisionSummary({
  kind,
  actorName,
  decidedAt,
  comments,
}: HITLDecisionSummaryProps) {
  return (
    <Card className="space-y-2 p-3">
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            "border-transparent gap-1 text-[10px] font-medium capitalize",
            TONE[kind],
          )}
        >
          {ICON[kind]}
          {kind.replace("-", " ")}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {actorName} · {new Date(decidedAt).toLocaleString()}
        </span>
      </div>
      {comments ? <p className="text-sm">{comments}</p> : null}
    </Card>
  );
}