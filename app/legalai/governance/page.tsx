'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Cpu, Shield, AlertTriangle, CheckCircle, XCircle, Activity, Zap } from 'lucide-react';

const MODELS = [
  { name: 'Llama 3.1 70B', status: 'active', dataClasses: ['public', 'internal'], agentPermissions: ['retrieval', 'analysis', 'drafting'] },
  { name: 'Llama 3.1 8B', status: 'active', dataClasses: ['public', 'internal', 'confidential'], agentPermissions: ['retrieval', 'analysis'] },
  { name: 'LegalBERT', status: 'active', dataClasses: ['public', 'internal'], agentPermissions: ['retrieval'] },
  { name: 'GPT-4o', status: 'restricted', dataClasses: ['public'], agentPermissions: ['analysis'] },
];

const INCIDENTS = [
  { type: 'Hallucination', count: 0, status: 'healthy' },
  { type: 'Validation Failure', count: 3, status: 'warning' },
  { type: 'Unauthorized Access', count: 0, status: 'healthy' },
  { type: 'Prompt Injection Detected', count: 1, status: 'warning' },
];

const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-700', restricted: 'bg-yellow-100 text-yellow-700' };

export default function GovernancePage() {
  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Cpu className="size-6 text-primary" /> AI Governance</h1>
          <p className="text-sm text-muted-foreground">Model registry, permissions, and AI safety controls</p>
        </div>
        <Button asChild variant="destructive" className="gap-2"><Link href="/legalai/hitl"><XCircle className="size-4" /> Emergency Kill Switch</Link></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle className="size-8 text-green-500" /><div><p className="text-2xl font-bold">4</p><p className="text-xs text-muted-foreground">Active Models</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Shield className="size-8 text-primary" /><div><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Security Incidents</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Activity className="size-8 text-blue-500" /><div><p className="text-2xl font-bold">247</p><p className="text-xs text-muted-foreground">Actions Today</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Zap className="size-8 text-yellow-500" /><div><p className="text-2xl font-bold">4</p><p className="text-xs text-muted-foreground">Pending Reviews</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Model Registry</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {MODELS.map((model) => (
              <div key={model.name} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{model.name}</span>
                    <Badge className={cn('text-[10px]', statusColors[model.status])} variant="secondary">{model.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {model.dataClasses.map((dc) => <Badge key={dc} variant="outline" className="text-[10px]">{dc}</Badge>)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">AI Incidents</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {INCIDENTS.map((incident) => (
              <div key={incident.type} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{incident.type}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{incident.count}</span>
                  {incident.status === 'healthy' ? <CheckCircle className="size-4 text-green-500" /> : <AlertTriangle className="size-4 text-yellow-500" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
