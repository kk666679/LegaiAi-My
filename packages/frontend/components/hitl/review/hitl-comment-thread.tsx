// components/hitl/review/hitl-comment-thread.tsx
"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { HITLComment } from "../types";

export interface HITLCommentThreadProps {
  comments: HITLComment[];
  onAdd?: (body: string, internal?: boolean) => void;
  className?: string;
}

export function HITLCommentThread({ comments, onAdd, className }: HITLCommentThreadProps) {
  const [draft, setDraft] = React.useState("");
  const [internal, setInternal] = React.useState(false);
  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Add a comment…"
        />
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={internal}
              onChange={(e) => setInternal(e.target.checked)}
              className="size-3.5"
            />
            Internal only
          </label>
          <Button
            size="sm"
            disabled={!draft.trim()}
            onClick={() => {
              onAdd?.(draft.trim(), internal);
              setDraft("");
            }}
          >
            Comment
          </Button>
        </div>
      </div>
      {comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const initials = c.actorName
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <li key={c.id} className="flex gap-2">
                <Avatar className="size-7">
                  <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{c.actorName}</span>
                    {c.internal ? (
                      <span className="rounded bg-amber-500/10 px-1 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                        Internal
                      </span>
                    ) : null}
                    <span className="text-muted-foreground">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm">{c.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}