"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  MessageSquarePlus,
  Pin,
  PinOff,
  Trash2,
  Search as SearchIcon,
  PanelRightOpen,
  PanelRightClose,
  Scale,
  Sparkles,
  FileText,
  Gavel,
  AlertTriangle,
  Menu,
} from "lucide-react";
import {
  Agent,
  AgentHeader,
} from "@/components/ai-elements/agent";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { AIMessage } from "@/components/lawmate/AIMessage";
import { AIComposer } from "@/components/lawmate/AIComposer";
import { LegalDisclaimer } from "@/components/lawmate/LegalDisclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import {
  MOCK_CONVERSATIONS,
  MOCK_INITIAL_MESSAGES,
  PROMPT_SUGGESTIONS,
  defaultComposerContext,
} from "@/lib/lawmate/data";
import { relativeTime } from "@/lib/lawmate/utils";
import type {
  ComposerContext,
  Conversation,
  Message as LMMessage,
} from "@/types/lawmate";
import {
  Artifact,
  ArtifactContent,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
  TaskItemFile,
} from "@/components/ai-elements/task";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { AIStatusIndicator } from "@/components/ai/aistatus-indicator";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
} from "@/components/ai-elements/chain-of-thought";
import {
  Checkpoint,
  CheckpointTrigger,
} from "@/components/ai-elements/checkpoint";
import {
  MessageActions,
  MessageAction,
  MessageToolbar,
} from "@/components/ai-elements/message";
import { Copy, RefreshCw, ThumbsUp, ThumbsDown } from "lucide-react";

interface UIMsg {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

const QUICK_PROMPTS = PROMPT_SUGGESTIONS.slice(0, 6).map((p) => p.label);

export default function AssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string>(MOCK_CONVERSATIONS[0]?.id ?? "");
  const [history, setHistory] = useState<UIMsg[]>(
    MOCK_INITIAL_MESSAGES.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })),
  );
  const [input, setInput] = useState("");
  const [composerContext, setComposerContext] = useState<ComposerContext>(
    defaultComposerContext(),
  );
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [conversationsSheetOpen, setConversationsSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Prefill from the workspace ask bar (`/legalai/assistant?q=…`). Read from
  // window.location instead of useSearchParams so no Suspense boundary is
  // required for the statically prerendered shell.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q?.trim()) setInput(q.trim());
  }, []);

  const { messages, sendMessage, status, stop, regenerate, setMessages } =
    useChat({
      api: "/api/chat",
      onError: () => undefined,
    } as any);

  const isLoading = status === "streaming" || status === "submitted";

  const displayMessages: UIMsg[] = [
    ...history,
    ...messages
      .filter((m) => m.role === "assistant")
      .map((m) => ({ id: m.id, role: m.role as "assistant", content: (m as any).content ?? "" })),
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [displayMessages.length]);

  const handleSubmit = (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: UIMsg = { id: `u-${Date.now()}`, role: "user", content: text };
    setHistory((h) => [...h, userMsg]);
    sendMessage({ text });
    setInput("");
  };

  const handleNewConversation = () => {
    const id = `c-${Date.now()}`;
    const newC: Conversation = {
      id,
      title: "New conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      preview: "Start typing to begin…",
    };
    setConversations((cs) => [newC, ...cs]);
    setActiveId(id);
    setHistory([]);
    setMessages([]);
    setConversationsSheetOpen(false);
  };

  const togglePin = (id: string) =>
    setConversations((cs) =>
      cs.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
    );

  const deleteConversation = (id: string) =>
    setConversations((cs) => cs.filter((c) => c.id !== id));

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const ConversationList = (
    <div className="flex h-full flex-col">
      <div className="border-b p-3 space-y-2">
        <Button onClick={handleNewConversation} className="w-full gap-2" size="sm">
          <MessageSquarePlus className="size-4" />
          New conversation
        </Button>
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations…"
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            filteredConversations
              .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
              .map((c) => {
                const active = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveId(c.id);
                      setConversationsSheetOpen(false);
                    }}
                    className={cn(
                      "group flex w-full flex-col gap-1 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      active ? "bg-primary/10" : "hover:bg-accent",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate font-medium">
                        {c.title}
                      </span>
                      {c.pinned && <Pin className="size-3 text-primary" />}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex-1 truncate">{c.preview}</span>
                      <span>{relativeTime(c.updatedAt)}</span>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-1 pt-1">
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={c.pinned ? "Unpin" : "Pin"}
                        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(c.id);
                        }}
                      >
                        {c.pinned ? (
                          <PinOff className="size-3" />
                        ) : (
                          <Pin className="size-3" />
                        )}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Delete"
                        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md hover:bg-accent text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(c.id);
                        }}
                      >
                        <Trash2 className="size-3" />
                      </span>
                    </div>
                  </button>
                );
              })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <DashboardShell>
      <div className="flex h-[calc(100vh-3.5rem-3rem)] sm:h-[calc(100vh-3.5rem-2.5rem)] -mx-4 sm:-mx-6 lg:-mx-8 -my-5 sm:-my-6 lg:-my-8 overflow-hidden border-y bg-background">
        {/* Conversations sidebar — desktop */}
        <aside className="hidden md:flex w-72 shrink-0 flex-col border-r bg-card/30">
          {ConversationList}
        </aside>

        {/* Mobile conversations sheet */}
        <Sheet open={conversationsSheetOpen} onOpenChange={setConversationsSheetOpen}>
          <SheetContent side="left" className="w-72 max-w-[85vw] p-0">
            {ConversationList}
          </SheetContent>
        </Sheet>

        {/* Chat column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b p-3">
            <Agent className="rounded-xl border-border/60 bg-card/50">
              <AgentHeader
                name="Law Mate Copilot"
                model="Llama 3.1 + pgVector · Malaysian jurisdiction"
              />
              <div className="px-3 pb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden -ml-1 gap-1"
                      aria-label="Open conversations"
                    >
                      <Menu className="size-3.5" />
                      <span className="hidden xs:inline">Chats</span>
                    </Button>
                  </SheetTrigger>
                </Sheet>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  Verified sources
                </Badge>
                <span className="hidden sm:inline">· Citation-checked</span>
                <Drawer open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto gap-1.5"
                    >
                      <PanelRightOpen className="size-3.5" /> Analysis
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader>
                      <DrawerTitle className="flex items-center gap-2">
                        <Gavel className="size-4 text-primary" /> Legal Analysis
                      </DrawerTitle>
                    </DrawerHeader>
                    <ScrollArea className="px-4 pb-6 max-h-[70vh]">
                      <AnalysisContent />
                    </ScrollArea>
                  </DrawerContent>
                </Drawer>
              </div>
            </Agent>
          </div>

          <ScrollArea ref={scrollRef} className="flex-1">
            <div className="mx-auto max-w-3xl px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
              {displayMessages.length === 0 ? (
                <EmptyState onPick={(p) => setInput(p)} />
              ) : (
                displayMessages.map((m) => (
                  <AIMessage
                    key={m.id}
                    message={{
                      ...MOCK_INITIAL_MESSAGES.find((x) => x.id === m.id),
                      id: m.id,
                      role: m.role,
                      content: m.content,
                      createdAt: new Date().toISOString(),
                    } as LMMessage}
                    onSuggestionClick={(s) => setInput(s)}
                    onRegenerate={() => regenerate?.()}
                  />
                ))
              )}
              {isLoading && (
                <div className="flex items-center gap-2 px-4">
                  <AIStatusIndicator
                    status="busy"
                    label="LawMate is reviewing authoritative sources"
                    size="sm"
                    showPulse
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t bg-card/40 p-3 sm:p-4">
            <div className="mx-auto max-w-3xl space-y-2">
              <LegalDisclaimer compact />
              <AIComposer
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                onStop={() => stop?.()}
                context={composerContext}
                onContextChange={setComposerContext}
                suggestions={PROMPT_SUGGESTIONS}
                placeholder="Ask LawMate — describe your legal question…"
              />
            </div>
          </div>
        </div>

        {/* Desktop right analysis panel */}
        <aside className="hidden xl:flex w-[min(36vw,420px)] shrink-0 flex-col border-l bg-card/30">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Gavel className="size-4 text-primary" />
              <span className="font-semibold text-sm">Legal Analysis</span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setRightPanelOpen(false)}
              aria-label="Hide analysis"
            >
              <PanelRightClose className="size-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <AnalysisContent />
          </ScrollArea>
        </aside>
      </div>
    </DashboardShell>
  );
}

function AnalysisContent() {
  return (
    <div className="space-y-3 p-4">
      <ChainOfThought defaultOpen>
        <ChainOfThoughtHeader>IRAC Reasoning trace</ChainOfThoughtHeader>
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Retrieve authoritative sources" status="complete" description="pgVector semantic search across Federal, Appeal and High Court corpora" />
          <ChainOfThoughtStep label="Identify applicable statutes" status="complete" description="Employment Act 1955 — s.24, s.60A, s.60D" />
          <ChainOfThoughtStep label="Apply IRAC framework" status="complete" description="Issue → Law → Application → Conclusion" />
          <ChainOfThoughtStep label="Citation verification" status="complete" description="All authorities cross-checked against LOM">
            <ChainOfThoughtSearchResults>
              <ChainOfThoughtSearchResult>EA 1955 s.24</ChainOfThoughtSearchResult>
              <ChainOfThoughtSearchResult>EA 1955 s.60A</ChainOfThoughtSearchResult>
              <ChainOfThoughtSearchResult>Regs 1980</ChainOfThoughtSearchResult>
            </ChainOfThoughtSearchResults>
          </ChainOfThoughtStep>
        </ChainOfThoughtContent>
      </ChainOfThought>

      <Checkpoint>
        <CheckpointTrigger tooltip="Issue — what legal question is being resolved">
          <Badge variant="secondary" className="text-[10px]">I</Badge>
          <span className="ml-1 text-xs font-medium">Issue</span>
        </CheckpointTrigger>
      </Checkpoint>
      <Artifact>
        <ArtifactContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Identify the lawful scope of deductions from an
            employee&rsquo;s wages under Malaysian law.
          </p>
        </ArtifactContent>
      </Artifact>

      <Checkpoint>
        <CheckpointTrigger tooltip="Relevant law and authorities">
          <Badge variant="secondary" className="text-[10px]">R</Badge>
          <span className="ml-1 text-xs font-medium">Law</span>
        </CheckpointTrigger>
      </Checkpoint>
      <Artifact>
        <ArtifactContent className="p-4">
          <p className="text-sm text-muted-foreground font-mono leading-relaxed">
            Employment Act 1955 — s.24, s.60A, s.60D. Read together with the
            Employment (Limitation on Deductions from Wages) Regulations 1980.
          </p>
        </ArtifactContent>
      </Artifact>

      <Checkpoint>
        <CheckpointTrigger tooltip="Application of law to facts">
          <Badge variant="secondary" className="text-[10px]">A</Badge>
          <span className="ml-1 text-xs font-medium">Application</span>
        </CheckpointTrigger>
      </Checkpoint>
      <Artifact>
        <ArtifactContent className="p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Deductions require written authorisation and must fall within the
            statutory list. Disciplinary fines are impermissible.
          </p>
        </ArtifactContent>
      </Artifact>

      <Checkpoint>
        <CheckpointTrigger tooltip="Conclusion">
          <Badge className="bg-primary text-primary-foreground text-[10px]">C</Badge>
          <span className="ml-1 text-xs font-medium">Conclusion</span>
        </CheckpointTrigger>
      </Checkpoint>
      <Artifact className="border-primary/30">
        <ArtifactContent className="p-4">
          <p className="text-sm font-medium text-foreground leading-relaxed">
            Permitted deductions are limited to those authorised in writing
            under s.24. Verify against the 1980 Regulations before relying on
            any deduction.
          </p>
          <MessageToolbar className="mt-3">
            <MessageActions>
              <MessageAction tooltip="Copy conclusion" onClick={() => navigator.clipboard?.writeText("Permitted deductions are limited to those authorised in writing under s.24.")}>
                <Copy className="size-3.5" />
              </MessageAction>
              <MessageAction tooltip="Regenerate analysis">
                <RefreshCw className="size-3.5" />
              </MessageAction>
              <MessageAction tooltip="Helpful">
                <ThumbsUp className="size-3.5" />
              </MessageAction>
              <MessageAction tooltip="Not helpful">
                <ThumbsDown className="size-3.5" />
              </MessageAction>
            </MessageActions>
          </MessageToolbar>
        </ArtifactContent>
      </Artifact>

      <Task defaultOpen>
        <TaskTrigger title="Verification steps" />
        <TaskContent>
          <TaskItem>
            <TaskItemFile>Verify s.24 wording in current Employment Act 1955</TaskItemFile>
            <p className="mt-1">
              Confirm there are no amendments in force that change the
              written-authorisation requirement.
            </p>
          </TaskItem>
          <TaskItem>
            <TaskItemFile>Check Industrial Court awards</TaskItemFile>
            <p className="mt-1">
              Recent awards touching deductions and disciplinary fines.
            </p>
          </TaskItem>
        </TaskContent>
      </Task>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center">
      <div className="mb-4 rounded-2xl bg-primary/10 p-4">
        <Scale className="size-8 text-primary" />
      </div>
      <h2 className="text-lg font-semibold mb-1">How can LawMate help?</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6 px-4">
        Ask a legal question, review an uploaded document, or choose a quick
        action below.
      </p>
      <Suggestions className="max-w-2xl px-4 sm:px-0 mb-2">
        {QUICK_PROMPTS.map((p) => (
          <Suggestion key={p} suggestion={p} onClick={onPick}>
            <Sparkles className="size-3.5 mr-1 text-primary" />
            {p}
          </Suggestion>
        ))}
      </Suggestions>
      <p className="text-xs text-muted-foreground mt-6 max-w-md px-4">
        <AlertTriangle className="inline size-3 -mt-0.5 mr-1" />
        AI-assisted. Verify conclusions against authoritative sources.
      </p>
    </div>
  );
}