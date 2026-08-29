'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Message, MessageContent, MessageResponse, MessageToolbar, MessageAction, MessageActions } from '@/components/ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from '@/components/ai-elements/prompt-input';
import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/sources';
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtStep, ChainOfThoughtContent } from '@/components/ai-elements/chain-of-thought';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { Agent, AgentHeader } from '@/components/ai-elements/agent';
import { copyToClipboard } from '@/lib/utils';
import { Bot, Copy, Scale, Search, BookOpen, Shield } from 'lucide-react';

interface LegalChatSource {
  title: string;
  url: string;
  court?: string;
}

interface LegalChatProps {
  apiEndpoint?: string;
  agentName?: string;
  model?: string;
  placeholder?: string;
  suggestions?: string[];
  sources?: LegalChatSource[];
  contextLabel?: string;
  className?: string;
  onMessageSent?: (text: string) => void;
}

export function LegalChat({
  apiEndpoint = '/api/chat',
  agentName = 'Law Mate Copilot',
  model = 'Llama 3.1 + pgVector',
  placeholder = 'Describe your legal issue or question (Malaysian context)...',
  suggestions = [],
  sources = [],
  contextLabel,
  className,
  onMessageSent,
}: LegalChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop } = useChat();
  const isLoading = status === 'streaming';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(({ text }: { text: string }) => {
    if (!text.trim() || isLoading) return;
    sendMessage({ text });
    setInput('');
    onMessageSent?.(text);
  }, [isLoading, sendMessage, onMessageSent]);

  const handleSuggestion = useCallback((suggestion: string) => {
    setInput(suggestion);
  }, []);

  return (
    <div className={cn('flex min-h-0 w-full min-w-0 flex-col', className)}>
      <Agent className="mx-3 mt-3 mb-0 rounded-xl border-border/50 sm:mx-4 sm:mt-4">
        <AgentHeader name={agentName} model={model} />
      </Agent>

      <div ref={scrollRef} className="flex-1 overflow-auto px-4">
        <div className="py-4 space-y-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-2xl bg-primary/10 p-4">
                <Scale className="size-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">{agentName}</h2>
              {contextLabel && (
                <p className="text-xs text-muted-foreground mb-2 px-3 py-1 bg-muted rounded-full">{contextLabel}</p>
              )}
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                AI-powered legal assistance grounded in verified evidence with citation checking.
              </p>
              {suggestions.length > 0 && (
                <Suggestions className="justify-center">
                  {suggestions.map((s) => (
                    <Suggestion key={s} suggestion={s} onClick={handleSuggestion} />
                  ))}
                </Suggestions>
              )}
            </div>
          )}

          {messages.map((m) => (
            <Message key={m.id} from={m.role as 'user' | 'assistant'}>
              <MessageContent>
                {m.role === 'assistant' ? (
                  <>
                    <MessageResponse>{(m as any).content ?? ''}</MessageResponse>
                    {sources.length > 0 && (
                      <Sources>
                        <SourcesTrigger count={sources.length} />
                        <SourcesContent>
                          {sources.map((src, i) => (
                            <Source key={i} href={src.url} title={`${src.title}${src.court ? ` (${src.court})` : ''}`} />
                          ))}
                        </SourcesContent>
                      </Sources>
                    )}
                    <MessageToolbar>
                      <MessageActions>
                        <MessageAction tooltip="Copy response" onClick={() => copyToClipboard((m as any).content ?? '')}>
                          <Copy className="size-3.5" />
                        </MessageAction>
                      </MessageActions>
                    </MessageToolbar>
                  </>
                ) : (
                  <MessageResponse>{(m as any).content ?? ''}</MessageResponse>
                )}
              </MessageContent>
            </Message>
          ))}

          {isLoading && (
            <Message from="assistant">
              <MessageContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="size-4 animate-pulse" />
                  <span>Analysing...</span>
                </div>
              </MessageContent>
            </Message>
          )}
        </div>
      </div>

      <div className="border-t p-3 sm:p-4">
        <PromptInput onSubmit={handleSubmit} className="border rounded-xl bg-card/50">
          <PromptInputTextarea value={input} onChange={(e: any) => setInput(e.target.value)} placeholder={placeholder} className="min-h-[60px]" />
          <PromptInputFooter>
            <span className="text-xs text-muted-foreground">IRAC analysis · Citation verification · Malaysian jurisdiction</span>
            <PromptInputSubmit status={isLoading ? 'streaming' : undefined} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
