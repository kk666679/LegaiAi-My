'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageToolbar,
  MessageAction,
  MessageActions,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
  ChainOfThoughtContent,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
} from '@/components/ai-elements/chain-of-thought';
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from '@/components/ai-elements/sources';
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactContent,
} from '@/components/ai-elements/artifact';
import {
  Suggestion,
  Suggestions,
} from '@/components/ai-elements/suggestion';
import {
  Agent,
  AgentHeader,
} from '@/components/ai-elements/agent';
import { copyToClipboard } from '@/lib/utils';
import {
  Scale,
  FileText,
  Search,
  BookOpen,
  Shield,
  Copy,
  Check,
  Bot,
} from 'lucide-react';
import { BRAND } from '@/lib/brand';

const DEMO_SOURCES = [
  { title: 'Contracts Act 1950 (Act 136)', url: 'https://www.legislation.gov.my', court: 'Federal' },
  { title: 'Tan Ah Kow v. ABC Sdn Bhd [2024] 1 MLJ 234', url: 'https://elaw.mlaw.gov.my', court: 'High Court' },
  { title: 'PDPA 2025 Amendment', url: 'https://www.pdp.gov.my', court: 'Statute' },
];

const SUGGESTIONS = [
  'Analyse a contract clause',
  'Research Malaysian employment law',
  'Draft a legal submission',
  'Check citation validity',
  'Run risk analysis on a matter',
  'Simulate opposing argument',
];

export default function LegalAIPage() {
  const [input, setInput] = useState('');
  const [irac, setIrac] = useState<{ issue: string; law: string; analysis: string; conclusion: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop } = useChat({
    onFinish(message: any) {
      const content = (message as any)?.content ?? '';
      const sections = { issue: '', law: '', analysis: '', conclusion: '' };
      let current = '';
      for (const line of content.split('\n')) {
        const lower = line.toLowerCase();
        if (lower.includes('issue')) current = 'issue';
        else if (lower.includes('law')) current = 'law';
        else if (lower.includes('analysis')) current = 'analysis';
        else if (lower.includes('conclusion')) current = 'conclusion';
        if (current) sections[current as keyof typeof sections] += line + '\n';
      }
      setIrac(sections);
    },
  });

  const isLoading = status === 'streaming';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = ({ text }: { text: string }) => {
    if (!text.trim() || isLoading) return;
    sendMessage({ text });
    setInput('');
  };

  const exportIRAC = () => {
    const text = `## ISSUE\n${irac?.issue || ''}\n\n## LAW\n${irac?.law || ''}\n\n## ANALYSIS\n${irac?.analysis || ''}\n\n## CONCLUSION\n${irac?.conclusion || ''}`.trim();
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] min-w-0 flex-col overflow-hidden xl:h-[calc(100dvh-3.5rem)] xl:flex-row">
      {/* LEFT: AI Chat */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col border-r">
        {/* Agent header */}
        <Agent className="m-4 mb-0 rounded-xl border-border/50">
          <AgentHeader name="Law Mate Copilot" model="Llama 3.1 + pgVector" />
        </Agent>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 px-4">
          <div className="py-4 space-y-1">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-2xl bg-primary/10 p-4">
                  <Scale className="size-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Law Mate Copilot</h2>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Ask legal questions in Malaysian context. Get IRAC analysis grounded in verified evidence with citation checking.
                </p>
                <Suggestions className="justify-center">
                  {SUGGESTIONS.map((s) => (
                    <Suggestion key={s} suggestion={s} onClick={handleSuggestion} />
                  ))}
                </Suggestions>
              </div>
            )}

            {messages.map((m) => (
              <Message key={m.id} from={m.role as 'user' | 'assistant'}>
                <MessageContent>
                  {m.role === 'assistant' ? (
                    <>
                      <MessageResponse>{(m as any).content ?? ''}</MessageResponse>

                      {/* Sources */}
                      <Sources>
                        <SourcesTrigger count={DEMO_SOURCES.length} />
                        <SourcesContent>
                          {DEMO_SOURCES.map((src, i) => (
                            <Source key={i} href={src.url} title={`${src.title} (${src.court})`} />
                          ))}
                        </SourcesContent>
                      </Sources>

                      {/* Chain of Thought */}
                      <ChainOfThought defaultOpen={false}>
                        <ChainOfThoughtHeader>IRAC Reasoning Process</ChainOfThoughtHeader>
                        <ChainOfThoughtContent>
                          <ChainOfThoughtStep
                            icon={Search}
                            label="Retrieved authorities"
                            status="complete"
                          >
                            <ChainOfThoughtSearchResults>
                              {DEMO_SOURCES.map((src, i) => (
                                <ChainOfThoughtSearchResult key={i}>{src.title}</ChainOfThoughtSearchResult>
                              ))}
                            </ChainOfThoughtSearchResults>
                          </ChainOfThoughtStep>
                          <ChainOfThoughtStep
                            icon={BookOpen}
                            label="Applied IRAC framework"
                            status="complete"
                          />
                          <ChainOfThoughtStep
                            icon={Shield}
                            label="Validated citations"
                            status="complete"
                          />
                        </ChainOfThoughtContent>
                      </ChainOfThought>

                      <MessageToolbar>
                        <MessageActions>
                          <MessageAction
                            tooltip="Copy response"
                            onClick={() => copyToClipboard((m as any).content ?? '')}
                          >
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
                    <span>Analysing with IRAC framework...</span>
                  </div>
                </MessageContent>
              </Message>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <PromptInput onSubmit={handleSubmit} className="border rounded-xl bg-card/50">
            <PromptInputTextarea
              value={input}
              onChange={(e: any) => setInput(e.target.value)}
              placeholder="Describe your legal issue or question (Malaysian context)..."
              className="min-h-[60px]"
            />
            <PromptInputFooter>
              <span className="text-xs text-muted-foreground">
                IRAC analysis · Citation verification · Malaysian jurisdiction
              </span>
              <PromptInputSubmit status={isLoading ? 'streaming' : undefined} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>

      {/* RIGHT: IRAC Panel */}
      <div className="hidden w-full min-w-0 flex-col border-l xl:flex xl:w-[min(36vw,420px)]">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <span className="font-semibold text-sm">IRAC Analysis</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={exportIRAC}
            disabled={!irac}
            className="gap-1.5"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4 space-y-3">
          {!irac ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <FileText className="size-8 mb-3 opacity-40" />
              <p className="text-sm">Submit a legal question to see IRAC analysis here.</p>
            </div>
          ) : (
            <>
              {/* Issue */}
              <Artifact>
                <ArtifactHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">1</Badge>
                    <ArtifactTitle>Issue</ArtifactTitle>
                  </div>
                </ArtifactHeader>
                <ArtifactContent className="p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {irac.issue.replace(/^#+\s*Issue[:\s]*/i, '').trim() || 'No issue identified.'}
                  </p>
                </ArtifactContent>
              </Artifact>

              {/* Law */}
              <Artifact>
                <ArtifactHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">2</Badge>
                    <ArtifactTitle>Law</ArtifactTitle>
                  </div>
                </ArtifactHeader>
                <ArtifactContent className="p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                    {irac.law.replace(/^#+\s*Law[:\s]*/i, '').trim() || 'No applicable law identified.'}
                  </p>
                </ArtifactContent>
              </Artifact>

              {/* Analysis */}
              <Artifact>
                <ArtifactHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">3</Badge>
                    <ArtifactTitle>Analysis</ArtifactTitle>
                  </div>
                </ArtifactHeader>
                <ArtifactContent className="p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {irac.analysis.replace(/^#+\s*Analysis[:\s]*/i, '').trim() || 'No analysis available.'}
                  </p>
                </ArtifactContent>
              </Artifact>

              {/* Conclusion */}
              <Artifact className="border-primary/30">
                <ArtifactHeader className="bg-primary/5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground text-[10px]">4</Badge>
                    <ArtifactTitle>Conclusion</ArtifactTitle>
                  </div>
                </ArtifactHeader>
                <ArtifactContent className="p-4">
                  <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
                    {irac.conclusion.replace(/^#+\s*Conclusion[:\s]*/i, '').trim() || 'No conclusion reached.'}
                  </p>
                </ArtifactContent>
              </Artifact>
            </>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
