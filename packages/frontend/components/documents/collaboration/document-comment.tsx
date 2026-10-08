"use client";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DocumentComment } from "../types";

export function DocumentComment({ comment, onResolve }: { comment: DocumentComment; onResolve?: (id: string) => void }) {
  const initials = comment.authorName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={cn("flex gap-3 rounded-md border border-border/60 p-2.5", comment.resolved && "opacity-60")}>
      <Avatar className="size-7">
        {comment.authorAvatarUrl ? <AvatarImage src={comment.authorAvatarUrl} alt="" /> : null}
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium">{comment.authorName}</span>
          <span className="text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-sm">{comment.body}</p>
        {comment.anchor?.excerpt ? <blockquote className="mt-1.5 border-l-2 border-primary/40 pl-2 text-xs italic text-muted-foreground">{comment.anchor.excerpt}</blockquote> : null}
        {onResolve && !comment.resolved ? <Button size="sm" variant="ghost" className="mt-1 h-6 px-2 text-[11px]" onClick={() => onResolve(comment.id)}>Resolve</Button> : null}
      </div>
    </div>
  );
}
