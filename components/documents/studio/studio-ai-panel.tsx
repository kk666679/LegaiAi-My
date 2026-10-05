"use client";

import { Button } from "@/components/ui/button";

export interface StudioAIMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
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
      <h2 className="text-sm font-semibold">Drafting assistant</h2>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="rounded-md bg-muted/50 p-3 text-sm">
            <p className="mb-1 text-xs font-medium capitalize text-muted-foreground">{message.role}</p>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
        {running && <p className="text-xs text-muted-foreground">{running}</p>}
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
