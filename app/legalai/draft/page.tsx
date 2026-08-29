'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { Agent, AgentHeader } from '@/components/ai-elements/agent';
import { ArtifactCard } from '@/components/ai/legal/artifact-card';
import { EvidencePanel } from '@/components/ai/legal/evidence-panel';
import { Bot, FileText, Shield, Plus, CheckCircle } from 'lucide-react';

const SUGGESTIONS = ['Improve argument', 'Find authority', 'Check citations', 'Draft section', 'Summarise evidence'];

const DOC_TYPES = ['Writ of Summons', 'Affidavit', 'Written Submission', 'Legal Opinion', 'Contract', 'Memorandum', 'Letter', 'Internal Note'];

const DEMO_EVIDENCE = [
  { title: 'Contracts Act 1950', citation: 'Act 136', court: 'Federal', verificationStatus: 'verified' as const, confidence: 0.98 },
  { title: 'PDPA 2010', citation: 'Act 709', court: 'Federal', verificationStatus: 'verified' as const, confidence: 0.96 },
];

export default function DraftPage() {
  const [docType, setDocType] = useState<string | null>(null);
  const [content, setContent] = useState('');

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Document Drafting</h1>
          <p className="text-sm text-muted-foreground">AI-assisted legal document creation</p>
        </div>
      </div>

      {!docType ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DOC_TYPES.map((type) => (
            <Button key={type} variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 hover:border-primary/30 hover:bg-primary/5" onClick={() => setDocType(type)}>
              <FileText className="size-8 text-primary" />
              <span className="text-sm font-medium">{type}</span>
            </Button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{docType}</Badge>
              <Button variant="ghost" size="sm" onClick={() => setDocType(null)}>Change type</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={`Start drafting your ${docType}...\n\nOr ask the AI assistant to generate a draft for you.`} className="w-full min-h-[500px] p-6 text-sm bg-transparent outline-none resize-none font-mono leading-relaxed" />
              </CardContent>
            </Card>
            {content.length > 50 && (
              <ArtifactCard title={docType} status="draft" content={content} evidenceCount={DEMO_EVIDENCE.length} />
            )}
          </div>

          {/* AI Assistant */}
          <div className="space-y-4">
            <Agent className="rounded-xl border-border/50">
              <AgentHeader name="Draft Assistant" model="Legal Drafting Agent" />
            </Agent>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Suggestions</CardTitle></CardHeader>
              <CardContent>
                <Suggestions className="flex-wrap">
                  {SUGGESTIONS.map((s) => <Suggestion key={s} suggestion={s} onClick={() => {}} />)}
                </Suggestions>
              </CardContent>
            </Card>

            <EvidencePanel evidence={DEMO_EVIDENCE} title="Supporting Evidence" />

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm"><CheckCircle className="size-4 text-green-600" /> Citation validation</div>
                <div className="flex items-center gap-2 text-sm"><Shield className="size-4 text-primary" /> Data classification enforced</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
