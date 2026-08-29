'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, ClipboardList } from 'lucide-react';

const CONTROLS = [
  { name: 'PDPA Compliance', status: 'compliant', lastReview: '2026-08-01', nextReview: '2026-11-01' },
  { name: 'Employment Act Compliance', status: 'compliant', lastReview: '2026-07-15', nextReview: '2026-10-15' },
  { name: 'Companies Act Filing', status: 'attention', lastReview: '2026-06-01', nextReview: '2026-09-01' },
  { name: 'Anti-Money Laundering', status: 'compliant', lastReview: '2026-08-10', nextReview: '2026-11-10' },
];

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; badge: string }> = { compliant: { icon: CheckCircle, color: 'text-green-600', badge: 'bg-green-100 text-green-700' }, attention: { icon: AlertTriangle, color: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' } };

export default function CompliancePage() {
  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="size-6 text-primary" /> Compliance</h1>
        <p className="text-sm text-muted-foreground">Regulatory compliance monitoring</p>
      </div>

      <div className="space-y-3">
        {CONTROLS.map((control) => {
          const config = statusConfig[control.status];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <Card key={control.name}>
              <CardContent className="p-4 flex items-center gap-4">
                <Icon className={cn('size-5', config.color)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2"><span className="font-medium">{control.name}</span><Badge className={cn('text-[10px]', config.badge)} variant="secondary">{control.status}</Badge></div>
                  <p className="text-xs text-muted-foreground mt-0.5">Last review: {control.lastReview} · Next review: {control.nextReview}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
