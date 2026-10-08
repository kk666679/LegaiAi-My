// components/hitl/notifications/hitl-sla-alerts.tsx
"use client";

import * as React from "react";
import { TimerOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { HITLRequest } from "../types";

export interface HITLSLAAlertsProps {
  requests: HITLRequest[];
  onOpen?: (r: HITLRequest) => void;
}

export function HITLSLAAlerts({ requests, onOpen }: HITLSLAAlertsProps) {
  const breached = requests.filter((r) => r.sla?.breached);
  const nearing = requests.filter(
    (r) =>
      !r.sla?.breached &&
      r.sla?.remainingMinutes != null &&
      r.sla.remainingMinutes < r.sla.hoursAllowed * 60 * 0.2,
  );
  if (!breached.length && !nearing.length) return null;

  return (
    <Card className="border-destructive/40 bg-destructive/5 p-3">
      <div className="flex items-start gap-3">
        <TimerOff className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">SLA attention needed</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {breached.length ? `${breached.length} breached` : ""}
            {breached.length && nearing.length ? " · " : ""}
            {nearing.length ? `${nearing.length} nearing deadline` : ""}
          </p>
          <ul className="mt-2 space-y-1">
            {breached.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate">{r.title}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => onOpen?.(r)}
                >
                  Open
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}