"use client";
import * as React from "react";
import { History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface DocumentAIHistoryEntry { id: string; label: string; timestamp: string; prompt?: string; }
export interface DocumentAIHistoryProps { entries: DocumentAIHistoryEntry[]; onSelect?: (e: DocumentAIHistoryEntry) => void; className?: string; }

export function DocumentAIHistory({ entries, onSelect, className }: DocumentAIHistoryProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
        <History className="size-3.5 text-muted-foreground" />
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">AI history</p>
      </div>
      <ScrollArea className="max-h-64">
        <ul className="space-y-1 p-2">
          {entries.length === 0 ? <li className="p-2 text-xs text-muted-foreground">No AI actions yet.</li> : entries.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => onSelect?.(e)} className={cn("w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/40")}>
                <span className="block truncate">{e.label}</span>
                <span className="block text-[10px] text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</span>
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
