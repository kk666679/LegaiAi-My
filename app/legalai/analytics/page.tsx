'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Agent, AgentHeader } from '@/components/ai-elements/agent';
import { BarChart3, Briefcase, FileText, Bot, Clock, TrendingUp, Users, Scale } from 'lucide-react';

const METRICS = [
  { label: 'Active Matters', value: '12', icon: Briefcase, change: '+2', changeType: 'neutral' },
  { label: 'Contract Volume', value: '48', icon: FileText, change: '+8', changeType: 'positive' },
  { label: 'AI Executions', value: '247', icon: Bot, change: '+34', changeType: 'positive' },
  { label: 'Human Approvals', value: '156', icon: Clock, change: '+12', changeType: 'positive' },
  { label: 'Research Requests', value: '89', icon: Scale, change: '+15', changeType: 'positive' },
  { label: 'Drafts Generated', value: '34', icon: FileText, change: '+6', changeType: 'positive' },
  { label: 'Clients Served', value: '23', icon: Users, change: '+3', changeType: 'positive' },
  { label: 'Time Saved (hrs)', value: '127', icon: TrendingUp, change: '+18', changeType: 'positive' },
];

const AI_METRICS = [
  { label: 'Agent Success Rate', value: '98.4%' },
  { label: 'Validation Failures', value: '3' },
  { label: 'Hallucination Events', value: '0' },
  { label: 'Avg Latency', value: '1.8s' },
  { label: 'Token Cost', value: '$12.40' },
  { label: 'Queue Health', value: 'Healthy' },
];

export default function AnalyticsPage() {
  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="size-6 text-primary" /> Executive Analytics</h1>
        <p className="text-sm text-muted-foreground">AI-powered insights into legal operations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {METRICS.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <metric.icon className="size-4" />
                <span className="text-xs">{metric.label}</span>
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-green-600 mt-0.5">{metric.change} this month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">AI Agent Performance</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {AI_METRICS.map((metric) => (
                <div key={metric.label} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  <span className="font-medium text-sm">{metric.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <Agent className="rounded-xl border-border/50">
            <AgentHeader name="Analytics Assistant" model="Insights Agent" />
          </Agent>
          <Card className="mt-4">
            <CardContent className="p-4 space-y-2 text-sm">
              <p className="font-medium">Key Insights</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• AI execution volume increased 16% this month</li>
                <li>• Zero hallucination events — citation accuracy maintained</li>
                <li>• 127 hours saved through AI-assisted workflows</li>
                <li>• Contract risk detection identified 18 high-risk clauses</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
