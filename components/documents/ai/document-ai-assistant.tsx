"use client";
import * as React from "react";
import { Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface DocumentAIMessage { id: string; role: "user" | "assistant"; content: string; sources?: Array<{ href: string; title: string }>; }
export interface DocumentAIAssistantProps { messages: DocumentAIMessage[]; composerSlot?: React.ReactNode; className?: string; }

export function DocumentAIAssistant({ messages, composerSlot, className }: DocumentAIAssistantProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-3">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground">Ask the assistant to summarise, explain, or find risks in this document.</p>
          ) : messages.map((m) => (
            <div key={m.id} className={cn("rounded-md px-3 py-2 text-sm", m.role === "user" ? "ml-4 bg-primary/10" : "mr-4 bg-muted/40")}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              {m.sources?.length ? (
                <ul className="mt-1.5 flex flex-wrap gap-1">
                  {m.sources.map((s) => <li key={s.href}><a href={s.href} target="_blank" rel="noreferrer" className="rounded bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:underline">{s.title}</a></li>)}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </ScrollArea>
      {composerSlot ? <div className="border-t border-border/60 p-3">{composerSlot}</div> : null}
    </div>
  );
}

export const DocumentAIHeaderIcon = Sparkles;
