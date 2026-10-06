// components/hitl/decisions/hitl-decision-panel.tsx
"use client";

import * as React from "react";
import { AlertTriangle, Check, ChevronRight, Clock, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { HITLDecisionKind, HITLRequest } from "../types";

export interface HITLDecisionPanelProps {
  request: HITLRequest;
  onDecide?: (kind: HITLDecisionKind, comments?: string) => void;
  onClaim?: () => void;
  onEscalate?: () => void;
}

const DECISION_META: Record<
  HITLDecisionKind,
  { label: string; icon: React.ReactNode; tone: string }
> = {
  approve: {
    label: "Approve",
    icon: <Check className="size-3.5" />,
    tone: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
  reject: {
    label: "Reject",
    icon: <X className="size-3.5" />,
    tone: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  "request-changes": {
    label: "Request changes",
    icon: <Send className="size-3.5" />,
    tone: "bg-violet-600 text-white hover:bg-violet-700",
  },
  escalate: {
    label: "Escalate",
    icon: <ChevronRight className="size-3.5" />,
    tone: "bg-orange-600 text-white hover:bg-orange-700",
  },
  defer: {
    label: "Defer",
    icon: <Clock className="size-3.5" />,
    tone: "bg-muted text-foreground hover:bg-muted/80",
  },
};

export function HITLDecisionPanel({
  request,
  onDecide,
  onClaim,
  onEscalate,
}: HITLDecisionPanelProps) {
  const [comments, setComments] = React.useState("");
  const canDecide = request.status === "in-review" && request.claimedBy != null;
  const isTerminal = ["approved", "rejected", "expired", "cancelled"].includes(request.status);

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-medium">Decision</p>

      {isTerminal ? (
        <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs">
          <p className="font-medium">Closed</p>
          {request.decision ? (
            <p className="mt-1 text-muted-foreground">
              {request.decision.actorName} {request.decision.kind.replace("-", " ")} ·{" "}
              {new Date(request.decision.decidedAt).toLocaleString()}
              {request.decision.comments ? ` — ${request.decision.comments}` : ""}
            </p>
          ) : null}
        </div>
      ) : canDecide ? (
        <>
          <div>
            <Label htmlFor="decision-notes" className="text-xs">
              Comments
            </Label>
            <Textarea
              id="decision-notes"
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Optional notes for the requester…"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              className={DECISION_META.approve.tone}
              onClick={() => onDecide?.("approve", comments)}
            >
              {DECISION_META.approve.icon}
              <span className="ml-1.5">{DECISION_META.approve.label}</span>
            </Button>
            <Button
              className={DECISION_META.reject.tone}
              onClick={() => onDecide?.("reject", comments)}
            >
              {DECISION_META.reject.icon}
              <span className="ml-1.5">{DECISION_META.reject.label}</span>
            </Button>
            <Button
              className={DECISION_META["request-changes"].tone}
              onClick={() => onDecide?.("request-changes", comments)}
            >
              {DECISION_META["request-changes"].icon}
              <span className="ml-1.5">{DECISION_META["request-changes"].label}</span>
            </Button>
            <Button
              className={DECISION_META.defer.tone}
              onClick={() => onDecide?.("defer", comments)}
            >
              {DECISION_META.defer.icon}
              <span className="ml-1.5">{DECISION_META.defer.label}</span>
            </Button>
          </div>
          <Button variant="outline" className="w-full gap-1.5" onClick={onEscalate}>
            {DECISION_META.escalate.icon}
            Escalate
          </Button>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <p>Claim this request to make a decision.</p>
          </div>
          <Button className="w-full" onClick={onClaim}>
            Claim
          </Button>
        </div>
      )}

      {request.requiredApprovals && request.requiredApprovals > 1 ? (
        <div className="rounded-md border border-border/60 p-2.5 text-xs">
          <p className="font-medium">Approvals</p>
          <p className="text-muted-foreground">
            {request.currentApprovals ?? 0} of {request.requiredApprovals}
          </p>
        </div>
      ) : null}
    </Card>
  );
}