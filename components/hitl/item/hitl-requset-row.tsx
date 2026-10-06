// components/hitl/item/hitl-request-row.tsx
"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HITLRequest } from "../types";
import { HITLStatusIndicator } from "../status/hitl-status-indicator";
import { HITLPriorityIndicator } from "../status/hitl-priority-indicator";
import { HITLKindBadge } from "./hitl-kind-badge";
import { HITLSLAIndicator } from "../status/hitl-sla-indicator";

export interface HITLRequestRowProps {
  request: HITLRequest;
  onOpen?: (r: HITLRequest) => void;
  selected?: boolean;
  className?: string;
}

export function HITLRequestRow({
  request,
  onOpen,
  selected,
  className,
}: HITLRequestRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(request)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(request);
        }
      }}
      className={cn(
        "group flex items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2.5 transition-colors hover:border-primary/40",
        selected && "border-primary/60 bg-accent/30",
        className,
      )}
    >
      <HITLKindBadge kind={request.kind} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{request.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          #{request.id.slice(-6)}
          {request.assignedTo ? ` · ${request.assignedTo.name}` : ""}
          {request.source?.domain ? ` · ${request.source.domain}` : ""}
        </p>
      </div>
      <HITLPriorityIndicator priority={request.priority} compact />
      <HITLStatusIndicator status={request.status} compact />
      {request.sla ? <HITLSLAIndicator sla={request.sla} /> : null}
      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}