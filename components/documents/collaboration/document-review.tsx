"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ReviewState = "draft" | "in-review" | "changes-requested" | "approved" | "final";
export interface DocumentReviewProps { state: ReviewState; reviewer?: string; onRequest?: () => void; onApprove?: () => void; onRequestChanges?: () => void; }

const LABEL: Record<ReviewState, string> = {
  draft: "Draft",
  "in-review": "In review",
  "changes-requested": "Changes requested",
  approved: "Approved",
  final: "Final",
};

export function DocumentReview({ state, reviewer, onRequest, onApprove, onRequestChanges }: DocumentReviewProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 p-3">
      <Badge variant="outline">{LABEL[state]}</Badge>
      {reviewer ? <span className="text-xs text-muted-foreground">Reviewer: {reviewer}</span> : null}
      <div className="ml-auto flex gap-2">
        {state === "draft" && onRequest ? <Button size="sm" onClick={onRequest}>Request review</Button> : null}
        {state === "in-review" && onApprove ? <Button size="sm" onClick={onApprove}>Approve</Button> : null}
        {state === "in-review" && onRequestChanges ? <Button size="sm" variant="outline" onClick={onRequestChanges}>Request changes</Button> : null}
      </div>
    </div>
  );
}
