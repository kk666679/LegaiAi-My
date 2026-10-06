"use client";
import * as React from "react";
import type { ApprovalRequest } from "../types";
import { ApprovalRequestCard } from "./approval-request";

export function ApprovalTracker({ requests, onApprove, onReject, onRequestChanges }: { requests: ApprovalRequest[]; onApprove?: (r: ApprovalRequest) => void; onReject?: (r: ApprovalRequest) => void; onRequestChanges?: (r: ApprovalRequest) => void }) {
  if (!requests.length) return <p className="text-sm text-muted-foreground">No approval requests.</p>;
  return <div className="space-y-2">{requests.map((r) => <ApprovalRequestCard key={r.id} request={r} onApprove={onApprove} onReject={onReject} onRequestChanges={onRequestChanges} />)}</div>;
}
