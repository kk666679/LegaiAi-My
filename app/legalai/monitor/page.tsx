'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Bell, AlertTriangle, CheckCircle, ExternalLink, Plus } from 'lucide-react';

const ALERTS = [
  { title: 'PDPA Amendment 2026 — New Data Breach Notification Requirements', severity: 'high', topic: 'Data Protection', jurisdiction: 'Federal', date: '2026-08-15', summary: 'Mandatory 72-hour breach notification now required for all data controllers.' },
  { title: 'Employment Act Amendment — Minimum Wage Revision', severity: 'medium', topic: 'Employment', jurisdiction: 'Federal', date: '2026-08-10', summary: 'Minimum wage increased to RM1,700 effective January 2027.' },
  { title: 'Court of Appeal Decision — Limitation Period for Construction Claims', severity: 'low', topic: 'Construction', jurisdiction: 'Court of Appeal', date: '2026-08-08', summary: 'Court reaffirmed 12-year limitation period under Limitation Act 1950.' },
  { title: 'BNM Guideline — Digital Banking License Requirements Updated', severity: 'medium', topic: 'Banking', jurisdiction: 'Federal', date: '2026-08-05', summary: 'Updated capital requirements and cybersecurity standards for digital banks.' },
];

const severityColors: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-blue-100 text-blue-700' };

export default function MonitorPage() {
  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="size-6 text-primary" /> Change Monitor</h1>
          <p className="text-sm text-muted-foreground">Regulatory and case-law monitoring with AI analysis</p>
        </div>
        <Button asChild className="gap-2"><Link href="/request-access"><Plus className="size-4" /> Subscribe to Topic</Link></Button>
      </div>

      <div className="space-y-3">
        {ALERTS.map((alert, i) => (
          <Card key={i} className="hover:border-primary/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{alert.title}</h3>
                    <Badge className={cn('text-[10px]', severityColors[alert.severity])} variant="secondary">{alert.severity}</Badge>
                    <Badge variant="outline" className="text-[10px]">{alert.topic}</Badge>
                    <Badge variant="outline" className="text-[10px]">{alert.jurisdiction}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{alert.summary}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.date}</p>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 shrink-0"><ExternalLink className="size-3" /> View</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
