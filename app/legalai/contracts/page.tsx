'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfidenceIndicator } from '@/components/ai/legal/confidence';
import { FileSignature, Plus, Bot, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';

const CONTRACTS = [
  { id: '1', title: 'Master Services Agreement — TechCorp', risk: 'low' as const, status: 'Active', clauses: 42, riskClauses: 2, lastAnalysed: '2 hours ago' },
  { id: '2', title: 'Employment Contract — Senior Dev', risk: 'medium' as const, status: 'Under Review', clauses: 28, riskClauses: 5, lastAnalysed: '1 day ago' },
  { id: '3', title: 'NDA — Green Valley Partnership', risk: 'low' as const, status: 'Active', clauses: 18, riskClauses: 1, lastAnalysed: '3 days ago' },
  { id: '4', title: 'Software License Agreement — DataShield', risk: 'high' as const, status: 'Pending Approval', clauses: 56, riskClauses: 8, lastAnalysed: '5 hours ago' },
];

const riskColors = { low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-700' };

export default function ContractsPage() {
  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contracts</h1>
          <p className="text-sm text-muted-foreground">AI-powered contract intelligence</p>
        </div>
        <Button asChild className="gap-2"><Link href="/legalai/draft"><Plus className="size-4" /> Upload Contract</Link></Button>
      </div>

      <div className="space-y-3">
        {CONTRACTS.map((contract) => (
          <Link key={contract.id} href={`/legalai/contracts/${contract.id}`}>
            <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <FileSignature className="size-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{contract.title}</h3>
                    <Badge className={cn('text-[10px]', riskColors[contract.risk])} variant="secondary">{contract.risk} risk</Badge>
                    <Badge variant="outline" className="text-[10px]">{contract.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{contract.clauses} clauses</span>
                    <span className="flex items-center gap-1"><AlertTriangle className="size-3" /> {contract.riskClauses} risk provisions</span>
                    <span>Last analysed: {contract.lastAnalysed}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Bot className="size-3.5" /> Re-analyse
                </Button>
                <ChevronRight className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
