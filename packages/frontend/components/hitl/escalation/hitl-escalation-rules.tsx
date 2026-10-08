// components/hitl/escalation/hitl-escalation-rules.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HITLRoutingRule } from "../types";

export interface HITLEscalationRulesProps {
  rules: HITLRoutingRule[];
  onToggle?: (id: string) => void;
  onEdit?: (r: HITLRoutingRule) => void;
}

export function HITLEscalationRules({ rules, onToggle, onEdit }: HITLEscalationRulesProps) {
  return (
    <div className="space-y-2">
      {rules.map((r) => (
        <Card key={r.id} className="flex items-start gap-3 p-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{r.name}</p>
              <Badge
                variant="outline"
                className={
                  r.enabled
                    ? "border-transparent bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
                    : "text-[10px]"
                }
              >
                {r.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            {r.description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
            ) : null}
            <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              {r.assignToTeam ? <span>→ {r.assignToTeam}</span> : null}
              {r.slaHours ? <span>SLA {r.slaHours}h</span> : null}
              {r.requiresApprovals ? <span>{r.requiresApprovals} approvals</span> : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-1.5">
            {onToggle ? (
              <button
                type="button"
                onClick={() => onToggle(r.id)}
                className="text-xs text-primary hover:underline"
              >
                {r.enabled ? "Disable" : "Enable"}
              </button>
            ) : null}
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(r)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Edit
              </button>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}