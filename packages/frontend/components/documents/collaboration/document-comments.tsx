"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DocumentComment } from "../types";
import { DocumentComment as CommentView } from "./document-comment";

export interface DocumentCommentsProps { comments: DocumentComment[]; onAdd?: (body: string) => void; onResolve?: (id: string) => void; }

export function DocumentComments({ comments, onAdd, onResolve }: DocumentCommentsProps) {
  const [draft, setDraft] = React.useState("");
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder="Add a comment…" />
        <div className="flex justify-end">
          <Button size="sm" disabled={!draft.trim()} onClick={() => { onAdd?.(draft.trim()); setDraft(""); }}>Comment</Button>
        </div>
      </div>
      {comments.length === 0 ? <p className="text-sm text-muted-foreground">No comments yet.</p> : (
        <div className="space-y-2">{comments.map((c) => <CommentView key={c.id} comment={c} onResolve={onResolve} />)}</div>
      )}
    </div>
  );
}
