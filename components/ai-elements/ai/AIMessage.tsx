"use client";

import { useState } from "react";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageToolbar,
  MessageAction,
  MessageActions,
} from "@/components/ai-elements/message";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ai-elements/sources";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselItem,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselPrev,
  InlineCitationCarouselNext,
  InlineCitationSource,
  InlineCitationQuote,
} from "@/components/ai-elements/inline-citation";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
  ChainOfThoughtContent,
} from "@/components/ai-elements/chain-of-thought";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  CopyIcon,
  CheckIcon,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  XCircle,
  Loader2,
} from "lucide-react";
import type {
  Citation,
  Message as LMMessage,
} from "@/types/lawmate";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils";
import { relativeTime } from "@/lib/lawmate/utils";

interface AIMessageProps {
  message: LMMessage;
  onCitationClick?: (citation: Citation) => void;
  onSuggestionClick?: (s: string) => void;
  onRegenerate?: () => void;
}

export function AIMessage({
  message,
  onCitationClick,
  onSuggestionClick,
  onRegenerate,
}: AIMessageProps) {
  const isAssistant = message.role === "assistant";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!isAssistant) {
    return (
      <Message from="user">
        <MessageContent>
          <MessageResponse>{message.content}</MessageResponse>
        </MessageContent>
      </Message>
    );
  }

  const sources = message.sources ?? [];
  const citations = message.citations ?? [];
  const tools = message.toolExecutions ?? [];
  const steps = message.reasoningSteps ?? [];

  return (
    <Message from="assistant">
      <MessageContent className="bg-card/50 border rounded-xl p-4">
        {/* Reasoning summary status */}
        {steps.length > 0 && (
          <ChainOfThought defaultOpen={false}>
            <ChainOfThoughtHeader>AI processing steps</ChainOfThoughtHeader>
            <ChainOfThoughtContent>
              {steps.map((s) => (
                <ChainOfThoughtStep
                  key={s.id}
                  icon={
                    s.status === "complete"
                      ? CheckCircle2
                      : s.status === "running"
                      ? Loader2
                      : s.status === "failed"
                      ? XCircle
                      : CircleDot
                  }
                  label={s.label}
                  status={s.status === "complete" ? "complete" : s.status === "failed" ? "active" : s.status === "running" ? "active" : "pending"}
                  description={s.detail}
                />
              ))}
            </ChainOfThoughtContent>
          </ChainOfThought>
        )}

        {/* Main response with inline citations */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MessageResponse>{message.content}</MessageResponse>
        </div>

        {/* Inline citations rendered as hover cards */}
        {citations.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground">Sources:</span>
            {citations.map((c) => (
              <InlineCitation key={c.index}>
                <InlineCitationCard>
                  <InlineCitationCardTrigger
                    sources={[c.source.url ?? c.source.title]}
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    [{c.index}]
                  </InlineCitationCardTrigger>
                  <InlineCitationCardBody>
                    <InlineCitationCarousel>
                      <InlineCitationCarouselContent>
                        <InlineCitationCarouselItem>
                          <InlineCitationCarouselHeader>
                            <Badge variant="secondary" className="text-[10px]">
                              {c.source.type}
                            </Badge>
                            <InlineCitationCarouselPrev />
                            <InlineCitationCarouselIndex />
                            <InlineCitationCarouselNext />
                          </InlineCitationCarouselHeader>
                          <InlineCitationSource
                            title={c.source.title}
                            url={c.source.url}
                            description={c.source.excerpt}
                          />
                          {c.source.excerpt && (
                            <InlineCitationQuote>{c.source.excerpt}</InlineCitationQuote>
                          )}
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[11px] text-muted-foreground">
                              {c.source.authority}
                              {c.source.section ? ` · ${c.source.section}` : ""}
                            </span>
                            {c.source.verified ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500">
                                <CheckCircle2 className="size-3" /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-500">
                                <AlertTriangle className="size-3" /> Needs verification
                              </span>
                            )}
                          </div>
                        </InlineCitationCarouselItem>
                      </InlineCitationCarouselContent>
                    </InlineCitationCarousel>
                  </InlineCitationCardBody>
                </InlineCitationCard>
              </InlineCitation>
            ))}
          </div>
        )}

        {/* Sources list (collapsible) */}
        {sources.length > 0 && (
          <Sources>
            <SourcesTrigger count={sources.length} />
            <SourcesContent>
              {sources.map((s, i) => (
                <Source
                  key={s.id}
                  href={s.url}
                  title={`${s.title}${s.section ? ` — ${s.section}` : ""}`}
                />
              ))}
            </SourcesContent>
          </Sources>
        )}

        {/* Tool execution */}
        {tools.length > 0 && (
          <ChainOfThought defaultOpen={false}>
            <ChainOfThoughtHeader>Tool execution</ChainOfThoughtHeader>
            <ChainOfThoughtContent>
              {tools.map((t) => (
                <ChainOfThoughtStep
                  key={t.id}
                  icon={
                    t.status === "complete"
                      ? CheckCircle2
                      : t.status === "running"
                      ? Loader2
                      : t.status === "failed"
                      ? XCircle
                      : CircleDot
                  }
                  label={
                    <span className="flex items-center gap-2">
                      <span>{t.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-2 text-[10px] capitalize",
                          t.status === "complete" && "border-emerald-500/30 text-emerald-500",
                          t.status === "running" && "border-primary/30 text-primary",
                          t.status === "failed" && "border-red-500/30 text-red-500",
                        )}
                      >
                        {t.status}
                      </Badge>
                    </span>
                  }
                  description={t.description}
                  status={
                    t.status === "complete"
                      ? "complete"
                      : t.status === "running"
                      ? "active"
                      : t.status === "failed"
                      ? "complete"
                      : "pending"
                  }
                />
              ))}
            </ChainOfThoughtContent>
          </ChainOfThought>
        )}

        {/* Suggested follow-ups */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">
              Related actions
            </p>
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSuggestionClick?.(s)}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs hover:bg-accent transition-colors"
                >
                  <Sparkles className="size-3 text-primary" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <MessageToolbar>
          <span className="text-[11px] text-muted-foreground">
            {message.verified ? (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-500" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="size-3 text-amber-500" /> Verify before relying
              </span>
            )}
            <span className="ml-2">{relativeTime(message.createdAt)}</span>
          </span>
          <MessageActions>
            <MessageAction tooltip="Copy" onClick={handleCopy}>
              {copied ? (
                <CheckIcon className="size-3.5 text-emerald-500" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
            </MessageAction>
            {onRegenerate && (
              <MessageAction tooltip="Regenerate" onClick={onRegenerate}>
                <RefreshCw className="size-3.5" />
              </MessageAction>
            )}
            <MessageAction tooltip="Helpful">
              <ThumbsUp className="size-3.5" />
            </MessageAction>
            <MessageAction tooltip="Not helpful">
              <ThumbsDown className="size-3.5" />
            </MessageAction>
          </MessageActions>
        </MessageToolbar>
      </MessageContent>
    </Message>
  );
}