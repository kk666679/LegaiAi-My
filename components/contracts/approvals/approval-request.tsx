"use client";
import * as React from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApprovalRequest } from "../types";

const TONE: Record<ApprovalRequest["status"], string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive",
  "changes-requested": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

export interface ApprovalRequestCardProps {
  request: ApprovalRequest;
  onApprove?: (r: ApprovalRequest) => void;
  onReject?: (r: ApprovalRequest) => void;
  onRequestChanges?: (r: ApprovalRequest) => void;
}

export function ApprovalRequestCard({ request, onApprove, onReject, onRequestChanges }: ApprovalRequestCardProps) {
  const pending = request.status === "pending";
  return (
    <Card className={cn("p-3", pending && "border-amber-500/40")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">Approval by {request.approverName}</p>
          <p className="text-xs text-muted-foreground">Requested by {request.requestedBy} · {new Date(request.requestedAt).toLocaleString()}</p>
          {request.threshold ? <p className="mt-1 text-xs">Threshold: {request.threshold.field} = {request.threshold.value}</p> : null}
        </div>
        <Badge variant="outline" className={cn("border-transparent text-[10px] font-medium capitalize", TONE[request.status])}>
          {request.status === "approved" ? <CheckCircle2 className="mr-1 size-3" /> : request.status === "rejected" ? <XCircle className="mr-1 size-3" /> : <Clock className="mr-1 size-3" />}
          {request.status.replace("-", " ")}
        </Badge>
      </div>
      {request.comments ? <p className="mt-2 text-sm">{request.comments}</p> : null}
      {pending ? (
        <div className="mt-3 flex gap-2">
          {onApprove ? <Button size="sm" onClick={() => onApprove(request)}>Approve</Button> : null}
          {onRequestChanges ? <Button size="sm" variant="outline" onClick={() => onRequestChanges(request)}>Request changes</Button> : null}
          {onReject ? <Button size="sm" variant="outline" className="text-destructive" onClick={() => onReject(request)}>Reject</Button> : null}
        </div>
      ) : null}
      {request.decidedAt ? <p className="mt-2 text-[11px] text-muted-foreground">Decided {new Date(request.decidedAt).toLocaleString()}</p> : null}
    </Card>
  );
}
