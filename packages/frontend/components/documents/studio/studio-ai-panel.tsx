"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BookTemplate, FileText } from "lucide-react";

/**
 * Flexible message shape. Components may pass either the component-layer
 * shape (role: "user" | "ai") or the persisted shape (role: "assistant" |
 * "user"). The panel renders whichever fields are present.
 */
export interface StudioAIMessage {
  id: string;
  role: string;
  content?: string;
  text?: React.ReactNode;
  author?: string;
  initials?: string;
  chips?: string[];
  time?: string;
}

export interface StudioAIAction {
  id: string;
  label: string;
}

export function StudioAIPanel({
  messages,
  running,
  actions = [],
  onAction,
  composerSlot,
}: {
  messages: StudioAIMessage[];
  running?: string | null;
  actions?: StudioAIAction[];
  onAction?: (id: string, label: string) => void;
  composerSlot?: React.ReactNode;
}) {
  return (
    <section className="flex h-full flex-col gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">Document Studio</p>
        <h2 className="mt-1 text-base font-semibold">Drafting assistant</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Organise your draft and open the document tools you need.</p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 && !running && (
          <div className="rounded-lg border border-dashed border-border p-4">
            <p className="text-sm font-medium">Your workspace is ready</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Start with a template or write in the editor. Review generated legal content against verified sources before use.</p>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className="rounded-md bg-muted/50 p-3 text-sm">
            <p className="mb-1 text-xs font-medium capitalize text-muted-foreground">{message.role}</p>
            {typeof message.content === "string" ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : message.text != null ? (
              <div className="whitespace-pre-wrap">{message.text}</div>
            ) : null}
          </div>
        ))}
        {running && <p className="text-xs text-muted-foreground">{running}</p>}
      </div>
      <div className="space-y-2 border-t border-border/60 pt-3">
        <p className="text-xs font-medium text-muted-foreground">Quick links</p>
        <Button asChild variant="outline" className="w-full justify-between">
          <Link href="/lawmate/documents/templates"><span className="flex items-center gap-2"><BookTemplate className="size-4" /> Browse templates</span><ArrowRight className="size-4" /></Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-between">
          <Link href="/lawmate/documents"><span className="flex items-center gap-2"><FileText className="size-4" /> All documents</span><ArrowRight className="size-4" /></Link>
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {actions.map((action) => (
          <Button key={action.id} size="sm" variant="outline" onClick={() => onAction?.(action.id, action.label)}>
            {action.label}
          </Button>
        ))}
      </div>
      {composerSlot}
    </section>
  );
}
