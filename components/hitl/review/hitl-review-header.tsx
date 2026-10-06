// components/hitl/review/hitl-review-header.tsx
"use client";

import * as React from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HITLRequest } from "../types";
import { HITLStatusIndicator } from "../status/hitl-status-indicator";
import { HITLPriorityIndicator } from "../status/hitl-priority-indicator";
import { HITLSLAIndicator } from "../status/hitl-sla-indicator";
import { HITLKindBadge } from "../item/hitl-kind-badge";

export interface HITLReviewHeaderProps {
  request: HITLRequest;
  actions?: React.ReactNode;
  className?: string;
}

export function HITLReviewHeader({ request, actions, className }: HITLReviewHeaderProps) {
  return (
    <header className={cn("border-b border-border/60 px-4 py-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <HITLKindBadge kind={request.kind} />
        <HITLStatusIndicator status={request.status} compact />
        <HITLPriorityIndicator priority={request.priority} compact />
        {request.escalationLevel ? (
          <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-600 dark:text-orange-400">
            Escalation L{request.escalationLevel}
          </span>
        ) : null}
      </div>
      <h1 className="mt-2 truncate text-lg font-semibold">{request.title}</h1>
      {request.description ? (
        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{request.description}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {request.assignedTo ? (
          <span className="inline-flex items-center gap-1">
            <User className="size-3" />
            {request.assignedTo.name}
          </span>
        ) : null}
        {request.sla ? <HITLSLAIndicator sla={request.sla} /> : null}
        <span>#{request.id.slice(-8)}</span>
        <span>Created {new Date(request.createdAt).toLocaleString()}</span>
      </div>
      {actions ? <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}