// components/hitl/item/hitl-request-card.tsx
"use client";

import * as React from "react";
import { ArrowRight, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HITLRequest } from "../types";
import { HITLStatusIndicator } from "../status/hitl-status-indicator";
import { HITLPriorityIndicator } from "../status/hitl-priority-indicator";
import { HITLSLAIndicator } from "../status/hitl-sla-indicator";
import { HITLKindBadge } from "./hitl-kind-badge";

export interface HITLRequestCardProps {
  request: HITLRequest;
  onOpen?: (r: HITLRequest) => void;
  selected?: boolean;
  className?: string;
}

export function HITLRequestCard({ request, onOpen, selected, className }: HITLRequestCardProps) {
  return (
    <Card
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
        "group cursor-pointer p-3 transition-colors hover:border-primary/40",
        selected && "border-primary/60 ring-1 ring-primary/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <HITLKindBadge kind={request.kind} />
            <HITLPriorityIndicator priority={request.priority} compact />
            {request.escalationLevel ? (
              <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-600 dark:text-orange-400">
                L{request.escalationLevel}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 truncate text-sm font-medium">{request.title}</p>
          {request.description ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {request.description}
            </p>
          ) : null}
        </div>
        <HITLStatusIndicator status={request.status} compact />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        {request.source?.domain ? (
          <span className="capitalize">{request.source.domain}</span>
        ) : null}
        {request.source?.aiConfidence != null ? (
          <span>AI {Math.round(request.source.aiConfidence * 100)}%</span>
        ) : null}
        {request.assignedTo ? (
          <span className="inline-flex items-center gap-1">
            <User className="size-3" />
            {request.assignedTo.name}
          </span>
        ) : null}
        {request.sla ? <HITLSLAIndicator sla={request.sla} /> : null}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>#{request.id.slice(-6)}</span>
        <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Card>
  );
}