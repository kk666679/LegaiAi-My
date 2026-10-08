"use client";
// app/ai/_components/assistant-context-panel.tsx
import * as React from "react";
import { BookOpen, FileText, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AssistantMessage } from "./use-ai-assistant";

export interface AIAssistantContextPanelProps {
  messages: AssistantMessage[];
  onClose: () => void;
  onNavigate: (href: string) => void;
}

export function AIAssistantContextPanel({
  messages,
  onClose,
  onNavigate,
}: AIAssistantContextPanelProps) {
  const citations = React.useMemo(() => {
    const map = new Map<string, { id: string; title: string; href?: string; count: number }>();
    for (const m of messages) {
      for (const c of m.citations ?? []) {
        const cur = map.get(c.id) ?? { id: c.id, title: c.title, href: c.href, count: 0 };
        cur.count += 1;
        map.set(c.id, cur);
      }
    }
    return [...map.values()];
  }, [messages]);

  const artifacts = React.useMemo(
    () => messages.flatMap((m) => m.artifacts ?? []),
    [messages],
  );

  const tools = React.useMemo(
    () => messages.flatMap((m) => m.tools ?? []),
    [messages],
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <p className="text-sm font-medium">Context</p>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7"
          aria-label="Close context panel"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </header>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-3">
          <Card className="p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Session
            </p>
            <dl className="mt-2 space-y-1 text-xs">
              <Row label="Messages" value={String(messages.length)} />
              <Row label="Citations" value={String(citations.length)} />
              <Row label="Artifacts" value={String(artifacts.length)} />
              <Row label="Tools used" value={String(tools.length)} />
            </dl>
          </Card>

          <Accordion type="multiple" defaultValue={["citations"]}>
            {citations.length > 0 ? (
              <AccordionItem value="citations">
                <AccordionTrigger className="text-xs uppercase tracking-wide">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="size-3.5" /> Citations ({citations.length})
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1.5">
                    {citations.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => c.href && onNavigate(c.href)}
                          className="flex w-full items-start gap-2 rounded-md border border-border/60 p-2 text-left transition-colors hover:border-primary/40"
                        >
                          <Link2 className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium">{c.title}</span>
                            {c.count > 1 ? (
                              <span className="mt-0.5 block text-[10px] text-muted-foreground">
                                Cited {c.count} times
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ) : null}

            {artifacts.length > 0 ? (
              <AccordionItem value="artifacts">
                <AccordionTrigger className="text-xs uppercase tracking-wide">
                  <span className="flex items-center gap-1.5">
                    <FileText className="size-3.5" /> Artifacts ({artifacts.length})
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1.5">
                    {artifacts.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => a.href && onNavigate(a.href)}
                          className="flex w-full items-start gap-2 rounded-md border border-border/60 p-2 text-left transition-colors hover:border-primary/40"
                        >
                          <FileText className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium">{a.label}</span>
                            <Badge variant="secondary" className="mt-1 text-[10px] capitalize">
                              {a.kind}
                            </Badge>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ) : null}
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
