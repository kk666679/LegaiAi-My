'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClassificationIndicator } from '@/components/ai/legal/classification';
import { ConfidenceIndicator } from '@/components/ai/legal/confidence';
import { Plus, Briefcase, Users, Clock, AlertTriangle, TrendingUp, ChevronRight, Bot } from 'lucide-react';

const MATTERS = [
  { id: '1', title: 'ABC Holdings v XYZ Corp', client: 'ABC Holdings Sdn Bhd', type: 'Corporate Litigation', risk: 'high' as const, status: 'Active', deadline: '2026-09-15', documents: 24, classification: 'confidential' as const },
  { id: '2', title: 'Tan Wei Ming Employment Dispute', client: 'TechStart Sdn Bhd', type: 'Employment', risk: 'medium' as const, status: 'Active', deadline: '2026-08-30', documents: 12, classification: 'internal' as const },
  { id: '3', title: 'Green Valley Sdn Bhd Acquisition', client: 'Green Valley Sdn Bhd', type: 'M&A', risk: 'low' as const, status: 'Pending Review', deadline: '2026-10-01', documents: 48, classification: 'privileged' as const },
  { id: '4', title: 'DataShield PDPA Compliance', client: 'DataShield Technologies', type: 'Compliance', risk: 'medium' as const, status: 'Active', deadline: '2026-08-25', documents: 8, classification: 'confidential' as const },
];

const riskColors = { low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-700' };

export default function MattersPage() {
  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matters</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage legal matters with AI-powered insights</p>
        </div>
        <Button asChild className="gap-2"><Link href="/legalai/draft"><Plus className="size-4" /> New Matter</Link></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Briefcase className="size-8 text-primary" /><div><p className="text-2xl font-bold">{MATTERS.length}</p><p className="text-xs text-muted-foreground">Active Matters</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="size-8 text-red-500" /><div><p className="text-2xl font-bold">1</p><p className="text-xs text-muted-foreground">High Risk</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="size-8 text-orange-500" /><div><p className="text-2xl font-bold">2</p><p className="text-xs text-muted-foreground">Approaching Deadline</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Bot className="size-8 text-blue-500" /><div><p className="text-2xl font-bold">12</p><p className="text-xs text-muted-foreground">AI Analyses Run</p></div></CardContent></Card>
      </div>

      <div className="space-y-3">
        {MATTERS.map((matter) => (
          <Link key={matter.id} href={`/legalai/matters/${matter.id}`}>
            <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{matter.title}</h3>
                    <Badge variant="outline" className="text-[10px]">{matter.type}</Badge>
                    <Badge className={cn('text-[10px]', riskColors[matter.risk])} variant="secondary">{matter.risk} risk</Badge>
                    <ClassificationIndicator classification={matter.classification} />
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="size-3" /> {matter.client}</span>
                    <span className="flex items-center gap-1"><Clock className="size-3" /> Due {matter.deadline}</span>
                    <span>{matter.documents} documents</span>
                    <Badge variant="secondary" className="text-[10px]">{matter.status}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Bot className="size-3.5" /> Analyse
                  </Button>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
