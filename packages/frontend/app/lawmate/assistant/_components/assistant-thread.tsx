"use client";
// app/lawmate/assistant/_components/assistant-thread.tsx
import * as React from "react";
import { Bot, Loader2, RefreshCw, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AssistantMessage, QuickPrompt } from "./use-ai-assistant";

export interface AIAssistantThreadProps {
  messages: AssistantMessage[];
  streaming: boolean;
  onRetry: (messageId: string) => void;
  quickPrompts: QuickPrompt[];
  onQuickPrompt: (p: QuickPrompt) => void;
  onNavigate: (href: string) => void;
}

export function AIAssistantThread({
  messages,
  streaming,
  onRetry,
  quickPrompts,
  onQuickPrompt,
  onNavigate,
}: AIAssistantThreadProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <ScrollArea ref={scrollRef} className="flex-1">
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
        {messages.map((m) => (
          <article key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="rounded-lg border border-border/60 bg-card px-3 py-2 text-sm">
                {m.error ? (
                  <p className="text-destructive">{m.error}</p>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
                {m.streaming ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" /> Generating
                  </span>
                ) : null}
              </div>
              {m.citations?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.citations.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => c.href && onNavigate(c.href)}
                      className="rounded-md border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    >
                      {c.title}
                    </button>
                  ))}
                </div>
              ) : null}
              {m.role === "assistant" && !m.streaming && m.content && (
                <div className="mt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-[11px] text-muted-foreground"
                    onClick={() => onRetry(m.id)}
                  >
                    <RefreshCw className="size-3" /> Retry
                  </Button>
                </div>
              )}
            </div>
          </article>
        ))}

        {streaming && messages[messages.length - 1]?.role !== "assistant" ? (
          <div className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              <Bot className="size-4" />
            </span>
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : null}

        {!streaming && messages.length <= 1 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {quickPrompts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onQuickPrompt(p)}
                className="rounded-lg border border-border/60 p-3 text-left text-sm hover:border-primary/40 hover:bg-accent/40"
              >
                <p className="font-medium">{p.label}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{p.prompt}</p>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </ScrollArea>
  );
}