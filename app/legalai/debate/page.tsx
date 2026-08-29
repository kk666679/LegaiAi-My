'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AgentTimeline } from '@/components/ai/legal/agent-timeline';
import { EvidencePanel } from '@/components/ai/legal/evidence-panel';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from '@/components/ai-elements/prompt-input';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Agent, AgentHeader } from '@/components/ai-elements/agent';
import { Bot, Swords } from 'lucide-react';

const DEMO_AGENTS = [
  { name: 'Research Agent', status: 'completed' as const, description: 'Found 18 supporting authorities', duration: '2.1s' },
  { name: 'Argument Agent', status: 'completed' as const, description: 'Constructed primary argument', duration: '3.4s' },
  { name: 'Counterargument Agent', status: 'running' as const, description: 'Building opposing position' },
  { name: 'Evidence Validator', status: 'queued' as const },
  { name: 'Adjudicator', status: 'queued' as const },
];

export default function DebatePage() {
  const [input, setInput] = useState('');
  const [started, setStarted] = useState(false);

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Swords className="size-6 text-primary" /> Debate Simulation</h1>
          <p className="text-sm text-muted-foreground">Multi-agent argument simulation for legal analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Legal Proposition</CardTitle></CardHeader>
            <CardContent>
              <PromptInput onSubmit={({ text }) => { setStarted(true); setInput(''); }} className="border rounded-xl bg-card/50">
                <PromptInputTextarea value={input} onChange={(e: any) => setInput(e.target.value)} placeholder="Enter a legal proposition to debate..." className="min-h-[80px]" />
                <PromptInputFooter>
                  <span className="text-xs text-muted-foreground">Multi-agent analysis</span>
                  <PromptInputSubmit />
                </PromptInputFooter>
              </PromptInput>
            </CardContent>
          </Card>

          {started && (
            <>
              <Agent className="rounded-xl border-border/50">
                <AgentHeader name="Debate Orchestrator" model="Multi-Agent Analysis" />
              </Agent>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Agent Execution</CardTitle></CardHeader>
                <CardContent className="p-0"><AgentTimeline steps={DEMO_AGENTS} /></CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Proposition</CardTitle></CardHeader>
                <CardContent>
                  <Message from="assistant">
                    <MessageContent>
                      <MessageResponse>{`## Primary Argument\n\nBased on Malaysian legal authorities, the proposition is supported by:\n\n1. **Employment Act 1955, Section 18** — Statutory protection\n2. **Tan Ah Kow v ABC [2024] 1 MLJ 234** — Judicial precedent\n\n### Strength of Argument\nThe primary argument is well-supported with verified authorities.`}</MessageResponse>
                    </MessageContent>
                  </Message>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardHeader className="pb-3"><CardTitle className="text-sm text-orange-700">Counterargument</CardTitle></CardHeader>
                <CardContent>
                  <Message from="assistant">
                    <MessageContent>
                      <MessageResponse>{`## Counter-Position\n\nThe opposing view relies on:\n\n1. **Industrial Relations Act 1967, Section 30** — Alternative remedy\n2. **Ling Ah Foong v ABC [2020] 2 ILR** — Distinguishing authority\n\n### Weakness Identified\nThe counterargument has limited authority in the current jurisdiction.`}</MessageResponse>
                    </MessageContent>
                  </Message>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="space-y-4">
          <EvidencePanel evidence={[
            { title: 'Employment Act 1955', citation: 'Act 265', verificationStatus: 'verified', confidence: 0.98 },
            { title: 'Tan Ah Kow v ABC', citation: '[2024] 1 MLJ 234', verificationStatus: 'verified', confidence: 0.92 },
            { title: 'IRA 1967', citation: 'Act 177', verificationStatus: 'verified', confidence: 0.95 },
          ]} />
        </div>
      </div>
    </div>
  );
}
