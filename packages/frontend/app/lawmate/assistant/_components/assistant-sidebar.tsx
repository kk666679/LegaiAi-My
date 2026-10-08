"use client";
// app/lawmate/assistant/_components/assistant-sidebar.tsx
import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Conversation } from "./use-ai-assistant";

export interface AIAssistantSidebarProps {
  conversations: Conversation[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onClose: () => void;
}

export function AIAssistantSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onPin,
  onClose,
}: AIAssistantSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <p className="text-sm font-semibold">Conversations</p>
        <Button size="sm" variant="ghost" onClick={onNew}>
          New
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="space-y-0.5" aria-label="Conversations">
          {conversations.map((c) => (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(c.id)}
              onDoubleClick={() => onRename(c.id, c.title)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(c.id);
                }
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm",
                activeId === c.id ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60",
              )}
            >
              <span className="truncate">{c.title}</span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Pin conversation"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPin(c.id, !c.pinned);
                  }}
                  className="rounded p-0.5 hover:bg-accent"
                >
                  📌
                </button>
                <button
                  type="button"
                  aria-label="Delete conversation"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  className="rounded p-0.5 hover:bg-destructive/20"
                >
                  🗑
                </button>
              </span>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}