"use client";
import * as React from "react";
import { Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractAIActions } from "./contract-ai-actions";

export interface ContractAIMessage { id: string; role: "user" | "assistant"; content: string; sources?: Array<{ href: string; title: string }>; }
export interface ContractAIWorkspaceProps {
  messages?: ContractAIMessage[];
  assistantSlot?: React.ReactNode;
  insightsSlot?: React.ReactNode;
  clausesSlot?: React.ReactNode;
  composerSlot?: React.ReactNode;
  onAction?: (id: string, label: string, prompt?: string) => void;
}

export function ContractAIWorkspace({ messages = [], assistantSlot, insightsSlot, clausesSlot, composerSlot, onAction }: ContractAIWorkspaceProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border/60 p-3">
        <ContractAIActions onAction={onAction} />
      </div>
      <Tabs defaultValue="assistant" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border/60 px-3 py-2">
          <TabsList>
            <TabsTrigger value="assistant">Assistant</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="clauses">Clauses</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="assistant" className="min-h-0 flex-1 overflow-y-auto p-3">
          {assistantSlot ?? (
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-3">
                {messages.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                    <Sparkles className="mx-auto size-5 text-muted-foreground" />
                    <p className="mt-2 text-xs text-muted-foreground">Ask the assistant about this contract, or run a quick action above.</p>
                  </div>
                ) : messages.map((m) => (
                  <div key={m.id} className={m.role === "user" ? "ml-6 rounded-md bg-primary/10 px-3 py-2 text-sm" : "mr-6 rounded-md bg-muted/40 px-3 py-2 text-sm"}>
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
          )}
        </TabsContent>
        <TabsContent value="insights" className="min-h-0 flex-1 overflow-y-auto p-3">{insightsSlot ?? <p className="text-xs text-muted-foreground">No insights yet.</p>}</TabsContent>
        <TabsContent value="clauses" className="min-h-0 flex-1 overflow-y-auto p-3">{clausesSlot ?? <p className="text-xs text-muted-foreground">No clauses analysed.</p>}</TabsContent>
      </Tabs>
      {composerSlot ? <div className="border-t border-border/60 p-3">{composerSlot}</div> : null}
    </div>
  );
}
