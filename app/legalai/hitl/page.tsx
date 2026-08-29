'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApprovalRequest } from '@/components/ai/legal/approval-request';
import { AgentTimeline } from '@/components/ai/legal/agent-timeline';
import { Eye, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const PENDING_APPROVALS = [
  { action: 'Generate written submission', agent: 'Legal Drafting Agent', authorizationLevel: 3 as const, matter: 'ABC Holdings v XYZ Corp', risk: 'medium' as const, evidenceCount: 12 },
  { action: 'Execute contract analysis', agent: 'Legal Analysis Agent', authorizationLevel: 2 as const, matter: 'Green Valley Acquisition', risk: 'low' as const, evidenceCount: 24 },
  { action: 'Publish research memorandum', agent: 'Legal Research Agent', authorizationLevel: 3 as const, matter: 'DataShield Compliance', risk: 'high' as const, evidenceCount: 8 },
  { action: 'Deploy monitoring alert', agent: 'Legal Monitor Agent', authorizationLevel: 2 as const, risk: 'low' as const, evidenceCount: 5 },
];

const RECENT_ACTIONS = [
  { name: 'Legal Retrieval', status: 'completed' as const, description: 'Found 24 sources for matter analysis', duration: '1.8s' },
  { name: 'Legal Analysis', status: 'completed' as const, description: 'Risk assessment completed', duration: '3.2s' },
  { name: 'Legal Validation', status: 'completed' as const, description: 'All citations verified', duration: '0.9s' },
  { name: 'Legal Drafting', status: 'awaiting_approval' as const, description: 'Draft submission ready for review' },
];

export default function HITLPage() {
  const [approvals, setApprovals] = useState(PENDING_APPROVALS);

  const handleApprove = (idx: number) => {
    setApprovals((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Eye className="size-6 text-primary" /> HITL Control Center</h1>
          <p className="text-sm text-muted-foreground">Human-in-the-loop oversight for AI agent actions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="size-8 text-yellow-500" /><div><p className="text-2xl font-bold">{approvals.length}</p><p className="text-xs text-muted-foreground">Pending Approval</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle className="size-8 text-green-500" /><div><p className="text-2xl font-bold">18</p><p className="text-xs text-muted-foreground">Approved Today</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><XCircle className="size-8 text-red-500" /><div><p className="text-2xl font-bold">1</p><p className="text-xs text-muted-foreground">Rejected Today</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="size-8 text-orange-500" /><div><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Unauthorized Attempts</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <h2 className="font-semibold">Pending Approvals</h2>
          {approvals.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No pending approvals</CardContent></Card>
          ) : (
            approvals.map((approval, idx) => (
              <ApprovalRequest key={idx} {...approval} onApprove={() => handleApprove(idx)} onReject={() => {}} onReview={() => {}} />
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Recent Agent Activity</h2>
          <Card><CardContent className="p-0"><AgentTimeline steps={RECENT_ACTIONS} /></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
