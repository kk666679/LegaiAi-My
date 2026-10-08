"use client";
// app/ai/_components/assistant-workspace.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { AIAssistantSidebar } from "./assistant-sidebar";
import { AIAssistantThread } from "./assistant-thread";
import { AIAssistantComposer } from "./assistant-composer";
import { AIAssistantContextPanel } from "./assistant-context-panel";
import type { AIAssistantApi, QuickPrompt } from "./use-ai-assistant";

export type AIAssistantWorkspaceProps = AIAssistantApi & {
  quickPrompts: QuickPrompt[];
  onNavigate: (href: string) => void;
};

export function AIAssistantWorkspace(props: AIAssistantWorkspaceProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [contextOpen, setContextOpen] = React.useState(true);

  return (
    <div className="flex h-dvh w-full bg-background">
      {sidebarOpen ? (
        <aside className="hidden w-64 shrink-0 border-r border-border/60 md:block">
          <AIAssistantSidebar
            conversations={props.conversations}
activeId={props.activeConversationId ?? undefined}
          onSelect={props.selectConversation}
          onNew={props.newConversation}
          onDelete={props.deleteConversation}
          onRename={props.renameConversation}
          onPin={props.pinConversation}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>
      ) : null}

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AIAssistantTopBar
          sidebarOpen={sidebarOpen}
          contextOpen={contextOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleContext={() => setContextOpen((v) => !v)}
          conversationTitle={props.activeConversation?.title ?? "New conversation"}
          onNew={props.newConversation}
        />

        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <AIAssistantThread
              messages={props.messages}
              streaming={props.streaming}
              onRetry={props.retry}
              quickPrompts={props.quickPrompts}
              onQuickPrompt={(p) => props.send(p.prompt)}
              onNavigate={props.onNavigate}
            />
            <AIAssistantComposer
              value={props.input}
              onChange={props.setInput}
              onSubmit={() => props.send()}
              onStop={props.stop}
              streaming={props.streaming}
            />
          </div>

          {contextOpen ? (
            <aside className="hidden w-[320px] shrink-0 border-l border-border/60 lg:block">
              <AIAssistantContextPanel
                messages={props.messages}
                onClose={() => setContextOpen(false)}
                onNavigate={props.onNavigate}
              />
            </aside>
          ) : null}
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Top bar
// ─────────────────────────────────────────────────────────────
function AIAssistantTopBar({
  sidebarOpen,
  contextOpen,
  onToggleSidebar,
  onToggleContext,
  conversationTitle,
  onNew,
}: {
  sidebarOpen: boolean;
  contextOpen: boolean;
  onToggleSidebar: () => void;
  onToggleContext: () => void;
  conversationTitle: string;
  onNew: () => void;
}) {
  return (
    <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
      <button
        type="button"
        aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        onClick={onToggleSidebar}
        className={cn(
          "grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground",
          !sidebarOpen && "md:hidden",
        )}
      >
        ☰
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-primary">
          AI Assistant
        </div>
        <p className="truncate text-sm font-medium">{conversationTitle}</p>
      </div>

      <button
        type="button"
        onClick={onNew}
        className="rounded-md border border-border/60 px-2.5 py-1 text-xs font-medium hover:bg-accent"
      >
        New chat
      </button>

      <button
        type="button"
        aria-label={contextOpen ? "Hide context" : "Show context"}
        onClick={onToggleContext}
        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        ⋯
      </button>
    </header>
  );
}
