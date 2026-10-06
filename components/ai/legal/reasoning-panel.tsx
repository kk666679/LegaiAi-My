'use client';

import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BrainIcon, ChevronDown, AlertTriangle } from 'lucide-react';
import { Streamdown } from 'streamdown';
import { cjk } from '@streamdown/cjk';
import { code } from '@streamdown/code';
import { math } from '@streamdown/math';
import { mermaid } from '@streamdown/mermaid';

const streamdownPlugins = { cjk, code, math, mermaid } as any;

interface IRACSection {
  label: string;
  content: string;
  verified?: boolean;
}

export interface ReasoningPanelProps {
  irac?: IRACSection[];
  assumptions?: string[];
  missingInfo?: string[];
  confidence?: string;
  className?: string;
}

export function ReasoningPanel({ irac = [], assumptions = [], missingInfo = [], confidence, className }: ReasoningPanelProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <BrainIcon className="size-4 text-primary" />
        Analysis Summary
      </h3>

      {irac.length > 0 && (
        <div className="space-y-2">
          {irac.map((section, idx) => (
            <Collapsible key={idx} defaultOpen={section.verified !== false}>
              <CollapsibleTrigger className="flex w-full items-center gap-2 text-left py-2 hover:text-foreground transition-colors">
                <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                <span className="font-medium text-sm">{section.label}</span>
                {section.verified === false && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">Unverified</span>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-3">
                <div className="ml-5 p-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
                  <Streamdown plugins={streamdownPlugins}>{section.content}</Streamdown>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {assumptions.length > 0 && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
          <p className="text-xs font-medium text-yellow-800 mb-1">Assumptions</p>
          <ul className="text-xs text-yellow-700 space-y-0.5">
            {assumptions.map((a, i) => <li key={i}>• {a}</li>)}
          </ul>
        </div>
      )}

      {missingInfo.length > 0 && (
        <div className="rounded-md bg-orange-50 border border-orange-200 p-3">
          <p className="text-xs font-medium text-orange-800 mb-1 flex items-center gap-1">
            <AlertTriangle className="size-3" /> Missing Information
          </p>
          <ul className="text-xs text-orange-700 space-y-0.5">
            {missingInfo.map((m, i) => <li key={i}>• {m}</li>)}
          </ul>
        </div>
      )}

      {confidence && (
        <p className="text-xs text-muted-foreground">Confidence: {confidence}</p>
      )}
    </div>
  );
}
