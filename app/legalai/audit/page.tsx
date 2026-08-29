'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, Bot, Clock } from 'lucide-react';

const AUDIT_ENTRIES = [
  { who: 'Legal Drafting Agent', what: 'Generated written submission', why: 'User request via AI Copilot', dataUsed: '3 verified sources', model: 'Llama 3.1 70B', result: 'Draft created — pending approval', timestamp: '10:32 AM' },
  { who: 'Legal Retrieval Agent', what: 'Searched Malaysian case law', why: 'Research query from matter context', dataUsed: '12 authorities', model: 'LegalBERT', result: '24 sources found, 18 verified', timestamp: '10:28 AM' },
  { who: 'Legal Validation Agent', what: 'Verified 8 citations', why: 'Automated post-retrieval validation', dataUsed: '8 citations', model: 'Llama 3.1 8B', result: 'All verified', timestamp: '10:29 AM' },
  { who: 'Counsel (Human)', what: 'Approved draft submission', why: 'HITL approval — L3 authorization', dataUsed: 'N/A', model: 'N/A', result: 'Approved and saved', timestamp: '10:35 AM' },
];

export default function AuditPage() {
  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="size-6 text-primary" /> Audit Trail</h1>
        <p className="text-sm text-muted-foreground">Complete audit log of AI and human actions</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {AUDIT_ENTRIES.map((entry, i) => (
              <div key={i} className="p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0 w-20">
                  <Clock className="size-3" /> {entry.timestamp}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{entry.who}</span>
                    <span className="text-sm text-muted-foreground">— {entry.what}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>Why: {entry.why}</span>
                    <span>Data: {entry.dataUsed}</span>
                    <span>Model: {entry.model}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Result: {entry.result}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
