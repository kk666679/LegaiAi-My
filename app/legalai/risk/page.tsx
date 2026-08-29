'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfidenceIndicator } from '@/components/ai/legal/confidence';
import { ReasoningPanel } from '@/components/ai/legal/reasoning-panel';
import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingUp, Shield, Clock, FileText, Bot } from 'lucide-react';

const RISKS = [
  { category: 'Matter Risk', score: 72, level: 'medium' as const, evidence: ['2 overdue deadlines', '1 unresolved obligation'], sources: 8 },
  { category: 'Contract Risk', score: 85, level: 'high' as const, evidence: ['3 high-risk clauses', 'Missing termination protection'], sources: 12 },
  { category: 'Compliance Risk', score: 34, level: 'low' as const, evidence: ['All obligations current', 'No regulatory changes detected'], sources: 15 },
  { category: 'Citation Risk', score: 12, level: 'low' as const, evidence: ['All citations verified', 'No outdated authorities'], sources: 24 },
];

const levelColors = { low: 'text-green-600 bg-green-50 border-green-200', medium: 'text-yellow-600 bg-yellow-50 border-yellow-200', high: 'text-red-600 bg-red-50 border-red-200' };

export default function RiskPage() {
  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="size-6 text-primary" /> Risk Engine</h1>
        <p className="text-sm text-muted-foreground">AI-powered risk analysis with evidence-backed scores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RISKS.map((risk) => (
          <Card key={risk.category} className={cn('border', risk.level === 'high' && 'border-red-200', risk.level === 'medium' && 'border-yellow-200')}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{risk.category}</CardTitle>
                <Badge className={cn('text-xs', levelColors[risk.level])} variant="outline">{risk.level}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="text-3xl font-bold">{risk.score}</div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground space-y-1">
                {risk.evidence.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
              <p className="text-xs text-muted-foreground">{risk.sources} sources consulted</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Bot className="size-4 text-primary" /> AI Risk Analysis</CardTitle></CardHeader>
          <CardContent>
            <ReasoningPanel
              irac={[
                { label: 'Key Risk Factors', content: 'The highest risk area is contract risk (score: 85/100), driven by 3 high-risk provisions identified in the DataShield license agreement.', verified: true },
                { label: 'Recommended Actions', content: '1. Review unlimited liability clause\n2. Negotiate indemnification cap\n3. Add termination protection', verified: true },
              ]}
              assumptions={['Risk scores are based on current matter data', 'All cited sources have been verified']}
              confidence="Based on 59 verified sources across 4 risk categories"
            />
          </CardContent>
        </Card>
        <ConfidenceIndicator level="medium" evidenceQuality="Good" sourcesVerified={57} totalSources={59} missingInfo={2} />
      </div>
    </div>
  );
}
