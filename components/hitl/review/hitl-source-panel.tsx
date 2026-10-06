// components/hitl/review/hitl-source-panel.tsx
"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { HITLRequest } from "../types";

export interface HITLSourcePanelProps {
  request: HITLRequest;
}

export function HITLSourcePanel({ request }: HITLSourcePanelProps) {
  if (!request.source) return null;
  const s = request.source;
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <p className="text-sm font-medium">AI context</p>
      </div>
      <dl className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Domain</dt>
          <dd className="capitalize">{s.domain}</dd>
        </div>
        {s.resourceName ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Resource</dt>
            <dd className="truncate">{s.resourceName}</dd>
          </div>
        ) : null}
        {s.action ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Action</dt>
            <dd className="truncate">{s.action}</dd>
          </div>
        ) : null}
        {s.aiModel ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Model</dt>
            <dd className="truncate">{s.aiModel}</dd>
          </div>
        ) : null}
      </dl>
      {typeof s.aiConfidence === "number" ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">AI confidence</span>
            <span className="tabular-nums">{Math.round(s.aiConfidence * 100)}%</span>
          </div>
          <Progress value={s.aiConfidence * 100} className="h-1.5" />
        </div>
      ) : null}
      {s.reasoningSummary ? (
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            Reasoning summary
          </p>
          <p className="text-xs leading-relaxed">{s.reasoningSummary}</p>
        </div>
      ) : null}
    </Card>
  );
}