"use client";
// app/ai/_components/use-ai-assistant.ts
import * as React from "react";

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
        // ── Real integration ─────────────────────────────────
        // Replace this block with a fetch to your endpoint,
        // reading a `text/event-stream` body and appending deltas.
        //
        //   const res = await fetch(options.endpoint ?? "/api/ai/chat", {
        //     method: "POST",
        //     signal: abortRef.current.signal,
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({ conversationId: activeConversationId, message: text }),
        //   });
        //   const reader = res.body?.getReader();
        //   ...stream into updateMessage(assistantId, { content: acc })
        //
        // ── Mock streaming so the UI is testable today ────────
        await mockStream(text, (delta, i) => {
          updateMessage(assistantId, { content: delta });
          if (i === 0) updateMessage(assistantId, { streaming: true });
        });

        // Attach mock citations and finish
        updateMessage(assistantId, {
          streaming: false,
          citations: [
            {
              id: "c1",
              title: "Employment Act 1955 — s.14",
              href: "https://lom.agc.gov.my/",
              excerpt:
                "The contract of service may be terminated by either party on grounds of misconduct.",
              source: "LOM Malaysia",
            },
          ],
        });
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

// ─────────────────────────────────────────────────────────────
// Mock streaming helper — replace with real SSE when backend is ready
// ─────────────────────────────────────────────────────────────
const MOCK_RESPONSES: Record<string, string> = {
  default:
    "Under the **Employment Act 1955 (Act 265)**, an employer's statutory duties include paying wages within 7 days of the wage period (s.19), providing a written contract of service (s.10), and complying with the working-hour limits in s.60A. Termination for misconduct requires a fair inquiry — see **s.14(1)(a)** — and the Industrial Court has consistently required a domestic inquiry before dismissal (see *Wong Yuen Foo v Soon Hing* [1973] 1 MLJ 225).\n\nIf you'd like, I can draft a warning letter or walk through the domestic inquiry checklist.",
  contract:
    "I scanned the contract for material risks. The three areas of highest concern:\n\n1. **Unlimited liability** — Clause 12.3 imposes uncapped liability on your side only. Standard position is a cap at 100% of fees paid in the preceding 12 months.\n2. **Indemnity for indirect losses** — Clause 14 covers consequential and indirect losses, which is unusual and typically excluded.\n3. **Termination without notice** — Clause 18 permits termination for convenience with 7 days' notice. Our playbook prefers 60 days.\n\nWant me to draft redlines for these?",
  deadline:
    "For a simple contract claim in Malaysia, the limitation period is **6 years** from the date the cause of action accrues (Limitation Act 1953, s.6). For claims based on a deed it is 12 years (s.20). Some exceptions apply — fraud, mistake, or concealed damage can extend the clock.",
};

async function mockStream(
  prompt: string,
  onDelta: (acc: string, index: number) => void,
): Promise<void> {
  const lower = prompt.toLowerCase();
  let full: string;
  if (lower.includes("contract") || lower.includes("risk")) {
    full = MOCK_RESPONSES.contract ?? "";
  } else if (lower.includes("limitation") || lower.includes("deadline")) {
    full = MOCK_RESPONSES.deadline ?? "";
  } else {
    full = MOCK_RESPONSES.default ?? "";
  }

  // Simulate token-by-token streaming
  const tokens = full.split(/(\s+)/);
  let acc = "";
  for (let i = 0; i < tokens.length; i++) {
    acc += tokens[i];
    onDelta(acc, i);
    await new Promise((r) => setTimeout(r, 12));
  }
}
