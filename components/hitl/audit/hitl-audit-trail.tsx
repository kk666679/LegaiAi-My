// components/hitl/audit/hitl-audit-trail.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { HITLActivityEvent } from "../types";

const LABEL: Record<string, string> = {
  created: "created",
  assigned: "assigned",
  reassigned: "reassigned",
  claimed: "claimed",
  commented: "commented",
  escalated: "escalated",
  "de-escalated": "de-escalated",
  approved: "approved",
  rejected: "rejected",
  "changes-requested": "requested changes",
  deferred: "deferred",
  expired: "expired",
  cancelled: "cancelled",
  "feedback-submitted": "submitted feedback",
  audit: "audit",
};

export interface HITLAuditTrailProps {
  events: HITLActivityEvent[];
}

export function HITLAuditTrail({ events }: HITLAuditTrailProps) {
  if (!events.length) return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  return (
    <Card className="p-4">
      <ol className="space-y-4">
        {events.map((e) => {
          const initials = (e.actorName ?? "?")
            .split(" ")
            .map((s) => s[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          return (
            <li key={e.id} className="flex gap-3">
              <Avatar className="size-7">
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{e.actorName ?? "System"}</span>{" "}
                  <span className="text-muted-foreground">{LABEL[e.kind] ?? e.kind}</span>
                </p>
                {e.message ? (
                  <p className="text-xs text-muted-foreground">{e.message}</p>
                ) : null}
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {new Date(e.timestamp).toLocaleString()}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}