"use client";

import Link from "next/link";
import { FileText, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import {
  Suggestion,
  Suggestions,
} from "@/components/ai-elements/suggestion";

/**
 * Contextual AI panel for document workspaces (§6).
 *
 * The panel is explicit about *what the AI is reasoning over* — the current
 * document is rendered as a visible context header above the conversation,
 * so this reads as a document copilot rather than a generic chat box
 * bolted onto a file view.
 *
 * Reuses the ai-elements conversation primitives rather than inventing a
 * second message renderer.
 */

export interface DocumentAIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function DocumentAIContext({
  documentId,
  documentTitle,
  documentType,
  /** Extra facts shown in the context strip (version, status, updated…). */
  facts,
  /** Link to the full document workspace. */
  documentHref,
  className,
}: {
  documentId: string;
  documentTitle: string;
  documentType?: string;
  facts?: Array<{ label: string; value: string }>;
  documentHref?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border bg-muted/40 p-2.5",
        className,
      )}
      data-slot="document-ai-context"
    >
      <FileText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">
          AI is working on this document
        </p>
        <Link
          href={documentHref ?? `/lawmate/documents/${documentId}`}
          className="block truncate text-sm font-medium hover:underline"
        >
          {documentTitle}
        </Link>
        {(documentType || facts?.length) && (
          <dl className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {documentType && (
              <div className="flex gap-1">
                <dt>Type</dt>
                <dd className="text-foreground">{documentType}</dd>
              </div>
            )}
            {facts?.map((f) => (
              <div key={f.label} className="flex gap-1">
                <dt>{f.label}</dt>
                <dd className="text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}

export function DocumentAIPanel({
  documentId,
  documentTitle,
  documentType,
  facts,
  messages,
  suggestions,
  onSend,
  onOpenAssistant,
  placeholder = "Ask about this document…",
  isThinking = false,
  className,
}: {
  documentId: string;
  documentTitle: string;
  documentType?: string;
  facts?: Array<{ label: string; value: string }>;
  messages: DocumentAIMessage[];
  suggestions?: string[];
  onSend: (text: string) => void;
  onOpenAssistant?: () => void;
  placeholder?: string;
  isThinking?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("flex h-full min-h-0 flex-col gap-3 p-3", className)}
      data-slot="document-ai-panel"
    >
      <DocumentAIContext
        documentId={documentId}
        documentTitle={documentTitle}
        documentType={documentType}
        facts={facts}
      />

      {/* Conversation */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 pr-3">
          {messages.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Ask a question about{" "}
              <span className="font-medium text-foreground">
                {documentTitle}
              </span>
              . Answers cite the document so you can verify them.
            </p>
          )}

          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent>
                {m.role === "assistant" ? (
                  <MessageResponse>{m.content}</MessageResponse>
                ) : (
                  m.content
                )}
              </MessageContent>
            </Message>
          ))}

          {isThinking && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 animate-pulse" aria-hidden />
              Reviewing the document…
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Suggested prompts */}
      {suggestions && suggestions.length > 0 && (
        <Suggestions>
          {suggestions.map((s) => (
            <Suggestion key={s} suggestion={s} onClick={onSend} />
          ))}
        </Suggestions>
      )}

      {/* Composer */}
      <PromptInput onSubmit={({ text }) => onSend(text)}>
        <PromptInputTextarea placeholder={placeholder} />
        <PromptInputFooter>
          {onOpenAssistant && (
            <Badge
              variant="outline"
              className="gap-1 text-[10px] font-normal"
            >
              <ShieldCheck className="size-3" aria-hidden />
              Human review required
            </Badge>
          )}
          <PromptInputSubmit
            status={isThinking ? "streaming" : undefined}
            aria-label="Send"
          />
        </PromptInputFooter>
      </PromptInput>

      {onOpenAssistant && (
        <ButtonLink onClick={onOpenAssistant} />
      )}
    </div>
  );
}

function ButtonLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-muted-foreground underline-offset-2 hover:underline"
    >
      Open in full AI Assistant
    </button>
  );
}