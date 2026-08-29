'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { copyToClipboard } from '@/lib/utils';
import { BookOpen, ChevronDown, ExternalLink, Copy, Check, Shield } from 'lucide-react';
import { useState } from 'react';

interface EvidenceItem {
  title: string;
  url?: string;
  court?: string;
  jurisdiction?: string;
  citation?: string;
  date?: string;
  excerpt?: string;
  verificationStatus: 'verified' | 'unverified' | 'insufficient';
  confidence?: number;
}

interface EvidencePanelProps {
  evidence: EvidenceItem[];
  title?: string;
  className?: string;
}

const verificationColors = {
  verified: 'bg-green-500/10 text-green-700 border-green-200',
  unverified: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  insufficient: 'bg-red-500/10 text-red-700 border-red-200',
};

const verificationLabels = {
  verified: 'Verified',
  unverified: 'Unverified',
  insufficient: 'Insufficient',
};

export function EvidencePanel({ evidence, title = 'Evidence & Sources', className }: EvidencePanelProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopyCitation = (citation: string, idx: number) => {
    copyToClipboard(citation);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (evidence.length === 0) {
    return (
      <div className={cn('rounded-lg border p-6 text-center', className)}>
        <Shield className="size-8 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No verified evidence available.</p>
        <p className="text-xs text-muted-foreground mt-1">Insufficient verified evidence for this query.</p>
      </div>
    );
  }

  const verifiedCount = evidence.filter((e) => e.verificationStatus === 'verified').length;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="secondary" className="text-xs">
          {verifiedCount}/{evidence.length} verified
        </Badge>
      </div>
      <div className="space-y-2">
        {evidence.map((item, idx) => (
          <Collapsible key={idx}>
            <div className="rounded-lg border bg-card/50 overflow-hidden">
              <CollapsibleTrigger className="flex w-full items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors">
                <BookOpen className="size-4 mt-0.5 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{item.title}</span>
                    <Badge className={cn('text-[10px] px-1.5 py-0 h-4 border', verificationColors[item.verificationStatus])}>
                      {verificationLabels[item.verificationStatus]}
                    </Badge>
                    {item.confidence !== undefined && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {Math.round(item.confidence * 100)}%
                      </Badge>
                    )}
                  </div>
                  {item.citation && (
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.citation}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {item.court && <span>{item.court}</span>}
                    {item.court && item.jurisdiction && <span>·</span>}
                    {item.jurisdiction && <span>{item.jurisdiction}</span>}
                    {item.date && <span>· {item.date}</span>}
                  </div>
                </div>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3">
                {item.excerpt && (
                  <div className="ml-7 p-3 rounded-md bg-muted/50 text-sm text-muted-foreground mb-2">
                    {item.excerpt}
                  </div>
                )}
                <div className="ml-7 flex items-center gap-2">
                  {item.url && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3" /> Open Source
                      </a>
                    </Button>
                  )}
                  {item.citation && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleCopyCitation(item.citation!, idx)}>
                      {copiedIdx === idx ? <Check className="size-3" /> : <Copy className="size-3" />}
                      {copiedIdx === idx ? 'Copied' : 'Copy Citation'}
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
