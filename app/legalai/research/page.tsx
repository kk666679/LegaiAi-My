'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Message, MessageContent, MessageResponse, MessageToolbar, MessageAction, MessageActions } from '@/components/ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from '@/components/ai-elements/prompt-input';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { Agent, AgentHeader } from '@/components/ai-elements/agent';
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtStep, ChainOfThoughtContent, ChainOfThoughtSearchResult, ChainOfThoughtSearchResults } from '@/components/ai-elements/chain-of-thought';
import { EvidencePanel } from '@/components/ai/legal/evidence-panel';
import { ConfidenceIndicator } from '@/components/ai/legal/confidence';
import { copyToClipboard } from '@/lib/utils';
import { Bot, BookOpen, Copy, Search, Shield, Scale } from 'lucide-react';

const SUGGESTIONS = [
  'Find supporting Malaysian employment authorities',
  'Find contrary authorities on limitation period',
  'Verify these citations',
  'Create a research memorandum',
  'Analyse the strongest precedent',
];

const DEMO_EVIDENCE = [
  { title: 'Tan Ah Kow v ABC Sdn Bhd [2024] 1 MLJ 234', url: 'https://elaw.mlaw.gov.my', court: 'High Court', citation: '[2024] 1 MLJ 234', excerpt: 'The court held that the Employment Act provides comprehensive protection for employees...', verificationStatus: 'verified' as const, confidence: 0.92 },
  { title: 'Employment Act 1955 (Act 265)', url: 'https://www.legislation.gov.my', citation: 'Act 265', excerpt: 'Section 18 provides for termination and lay-off benefits...', verificationStatus: 'verified' as const, confidence: 0.98 },
  { title: 'Industrial Relations Act 1967', url: 'https://www.legislation.gov.my', citation: 'Act 177', excerpt: 'Part IX provides for the regulation of relations between employers and workmen...', verificationStatus: 'verified' as const, confidence: 0.95 },
];

export default function ResearchPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = ({ text }: { text: string }) => {
    if (!text.trim() || isLoading) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsLoading(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'assistant', content: `## Research Analysis\n\nBased on Malaysian legal authorities, here is the analysis:\n\n### Key Authorities Found\n1. **Tan Ah Kow v ABC Sdn Bhd [2024] 1 MLJ 234** — Directly relevant precedent\n2. **Employment Act 1955 (Act 265)** — Primary statute\n3. **Industrial Relations Act 1967** — Procedural framework\n\n### Analysis\nThe strongest authority supports the proposition that...\n\n### Citation Verification\nAll 3 citations verified against official Malaysian law databases.` }]);
      setIsLoading(false);
    }, 3000);
  };

  return (
    <div className="content-width min-w-0 p-0 sm:p-4 lg:p-6">
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-6 xl:min-h-[calc(100dvh-12rem)]">
        {/* Chat */}
        <div className="xl:col-span-2 flex flex-col">
          <Agent className="mx-4 mt-4 mb-0 rounded-xl border-border/50">
            <AgentHeader name="Legal Research Agent" model="Retrieval + Analysis" />
          </Agent>

          <div className="flex-1 overflow-auto px-4">
            <div className="py-4 space-y-1">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 rounded-2xl bg-primary/10 p-4"><Search className="size-8 text-primary" /></div>
                  <h2 className="text-lg font-semibold mb-1">Legal Research</h2>
                  <p className="text-sm text-muted-foreground max-w-md mb-6">Find authorities, verify citations, and build evidence-backed research.</p>
                  <Suggestions className="justify-center">
                    {SUGGESTIONS.map((s) => <Suggestion key={s} suggestion={s} onClick={(sug) => handleSubmit({ text: sug })} />)}
                  </Suggestions>
                </div>
              )}

              {messages.map((m, i) => (
                <Message key={i} from={m.role}>
                  <MessageContent>
                    {m.role === 'assistant' ? (
                      <>
                        <MessageResponse>{m.content}</MessageResponse>
                        <MessageToolbar>
                          <MessageActions>
                            <MessageAction tooltip="Copy" onClick={() => copyToClipboard(m.content)}><Copy className="size-3.5" /></MessageAction>
                          </MessageActions>
                        </MessageToolbar>
                      </>
                    ) : (
                      <MessageResponse>{m.content}</MessageResponse>
                    )}
                  </MessageContent>
                </Message>
              ))}

              {isLoading && (
                <Message from="assistant">
                  <MessageContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Bot className="size-4 animate-pulse" />
                      <span>Searching Malaysian authorities...</span>
                    </div>
                  </MessageContent>
                </Message>
              )}
            </div>
          </div>

          <div className="border-t p-4">
            <PromptInput onSubmit={handleSubmit} className="border rounded-xl bg-card/50">
              <PromptInputTextarea value={input} onChange={(e: any) => setInput(e.target.value)} placeholder="Research a legal question..." className="min-h-[60px]" />
              <PromptInputFooter>
                <span className="text-xs text-muted-foreground">Hybrid retrieval · Citation verification</span>
                <PromptInputSubmit status={isLoading ? 'streaming' : undefined} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>

        {/* Evidence sidebar */}
        <div className="space-y-4 overflow-auto">
          <EvidencePanel evidence={DEMO_EVIDENCE} title="Research Sources" />
          <ConfidenceIndicator level="high" evidenceQuality="Strong" sourcesVerified={3} totalSources={3} />
        </div>
      </div>
    </div>
  );
}
