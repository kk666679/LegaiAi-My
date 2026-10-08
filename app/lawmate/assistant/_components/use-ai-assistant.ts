"use client";
// app/ai/_components/use-ai-assistant.ts
import * as React from "react";
import { getToken } from "@/lib/auth";

export type MessageRole = "user" | "assistant" | "system";

export interface Citation {
  id: string;
  title: string;
  href?: string;
  excerpt?: string;
  source?: string;
  page?: number;
}

export interface AssistantMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  /** Streaming state — true while the model is still generating. */
  streaming?: boolean;
  /** Chain-of-thought / reasoning summary (never raw private CoT). */
  reasoning?: string;
  /** Sources backing the answer. */
  citations?: Citation[];
  /** Tool calls invoked during the response. */
  tools?: Array<{
    id: string;
    name: string;
    state: "input-streaming" | "input-available" | "output-available" | "output-error";
    input?: unknown;
    output?: string;
    errorText?: string;
  }>;
  /** Attached artifacts (drafts, analyses, etc.). */
  artifacts?: Array<{
    id: string;
    kind: "document" | "draft" | "analysis" | "matter" | "contract" | "note";
    label: string;
    preview?: string;
    href?: string;
  }>;
  /** Error state — only populated when the request failed. */
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  pinned?: boolean;
  tag?: "research" | "drafting" | "analysis" | "compliance";
}

export interface QuickPrompt {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

export interface AIAssistantOptions {
  onNavigate?: (href: string) => void;
  /** Real endpoint override — leave undefined to use the mock. */
  endpoint?: string;
}

export interface AIAssistantApi {
  // State
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: AssistantMessage[];
  input: string;
  streaming: boolean;
  error?: string;

  // Derived
  activeConversation: Conversation | null;

  // Actions
  setInput: (v: string) => void;
  send: (prompt?: string) => void;
  stop: () => void;
  retry: (messageId: string) => void;
  newConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  pinConversation: (id: string, pinned: boolean) => void;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { id: "case-summary", label: "Summarise a case", prompt: "Summarise the key holdings in [case name]", icon: "scale" },
  { id: "contract-risks", label: "Find contract risks", prompt: "Identify material risks in this contract", icon: "shield" },
  { id: "employment-duties", label: "Employer duties", prompt: "What are the statutory duties of an employer under the Employment Act 1955?", icon: "briefcase" },
  { id: "draft-letter", label: "Draft a demand letter", prompt: "Draft a demand letter for unpaid invoices", icon: "pen-line" },
  { id: "compliance-check", label: "Compliance check", prompt: "Check this clause against PDPA 2010", icon: "check" },
  { id: "deadline-calc", label: "Calculate deadline", prompt: "What is the limitation period for a contract claim in Malaysia?", icon: "clock" },
];

const STARTER_MESSAGE: AssistantMessage = {
  id: "welcome",
  role: "assistant",
  createdAt: new Date().toISOString(),
  content:
    "I'm LegAI. Ask a legal question, paste a clause, or attach a document to analyse. I'll cite Malaysian statutes and cases where I can, and flag anything I'm uncertain about.",
};

export function useAIAssistant(options: AIAssistantOptions = {}): AIAssistantApi & {
  quickPrompts: QuickPrompt[];
  onNavigate: (href: string) => void;
} {
  const [conversations, setConversations] = React.useState<Conversation[]>([
    {
      id: "conv-welcome",
      title: "Getting started",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 1,
      pinned: true,
    },
  ]);
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>("conv-welcome");
  const [messages, setMessages] = React.useState<AssistantMessage[]>([STARTER_MESSAGE]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const abortRef = React.useRef<AbortController | null>(null);

  const activeConversation = React.useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  const appendMessage = React.useCallback((msg: AssistantMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateMessage = React.useCallback((id: string, patch: Partial<AssistantMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const send = React.useCallback(
    async (promptOverride?: string) => {
      const text = (promptOverride ?? input).trim();
      if (!text || streaming) return;

      const userMsg: AssistantMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      appendMessage(userMsg);
      setInput("");
      setError(undefined);

      // Placeholder assistant message that streams content into place
      const assistantId = `a-${Date.now()}`;
      appendMessage({
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        streaming: true,
        reasoning: "Retrieving authorities, drafting response…",
      });

      setStreaming(true);
      abortRef.current = new AbortController();

      try {
        // ── Real SSE streaming via /api/chat ──────────────────────
        const chatMessages = messages
          .filter((m) => m.content.trim() || m.role === 'user')
          .map((m) => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content.slice(0, 12_000),
          }))
          .slice(-40);

        if (chatMessages.length === 0 || chatMessages[chatMessages.length - 1]?.role === 'assistant') {
          chatMessages.push({ role: 'user' as const, content: text });
        }

        const res = await fetch('/api/chat', {
          method: 'POST',
          signal: abortRef.current.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
          body: JSON.stringify({ messages: chatMessages }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(res.status === 429 ? 'Rate limited — please try again shortly.' : body || `Chat failed (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('Streaming not supported');

        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            try {
              const event = JSON.parse(trimmed.slice(5).trim()) as Record<string, unknown>;
              const type = event.type as string | undefined;
              if (type === 'TEXT_MESSAGE_CONTENT') {
                const delta = (event.delta as string) ?? '';
                accumulated += delta;
                updateMessage(assistantId, { content: accumulated });
              } else if (type === 'RUN_ERROR') {
                const errMsg = (event.error as string) ?? (event.message as string) ?? 'Streaming error';
                throw new Error(errMsg);
              }
            } catch (parseErr) {
              if ((parseErr as Error).name !== 'SyntaxError') throw parseErr;
              // ignore malformed SSE data lines
            }
          }
        }

        updateMessage(assistantId, { streaming: false });
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          updateMessage(assistantId, { streaming: false });
        } else {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
          updateMessage(assistantId, {
            streaming: false,
            error: message,
          });
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [input, streaming, activeConversationId, appendMessage, updateMessage],
  );

  const stop = React.useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const retry = React.useCallback(
    (messageId: string) => {
      // Find the user message just before this assistant message and resend
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx < 1) return;
      const userMsg = [...messages].slice(0, idx).reverse().find((m) => m.role === "user");
      if (userMsg) void send(userMsg.content);
    },
    [messages, send],
  );

  const newConversation = React.useCallback(() => {
    const id = `conv-${Date.now()}`;
    const conv: Conversation = {
      id,
      title: "New conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveConversationId(id);
    setMessages([{ ...STARTER_MESSAGE, id: `welcome-${id}` }]);
  }, []);

  const selectConversation = React.useCallback((id: string) => {
    setActiveConversationId(id);
    // In production, fetch messages for this conversation.
    setMessages([{ ...STARTER_MESSAGE, id: `welcome-${id}` }]);
  }, []);

  const deleteConversation = React.useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([STARTER_MESSAGE]);
      }
    },
    [activeConversationId],
  );

  const renameConversation = React.useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c)),
    );
  }, []);

  const pinConversation = React.useCallback((id: string, pinned: boolean) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned } : c)));
  }, []);

  return {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    input,
    streaming,
    error,
    setInput,
    send,
    stop,
    retry,
    newConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    pinConversation,
    quickPrompts: QUICK_PROMPTS,
    onNavigate: options.onNavigate ?? (() => {}),
  };
}

// (Mock streaming removed — assistant now streams from /api/chat.)
