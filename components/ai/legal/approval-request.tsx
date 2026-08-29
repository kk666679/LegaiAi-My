'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Clock, Bot, CheckCircle, XCircle, Eye } from 'lucide-react';

type AuthorizationLevel = 0 | 1 | 2 | 3 | 4 | 5;

interface ApprovalRequestProps {
  action: string;
  agent: string;
  authorizationLevel: AuthorizationLevel;
  matter?: string;
  risk?: 'low' | 'medium' | 'high' | 'critical';
  evidenceCount?: number;
  onApprove?: () => void;
  onReject?: () => void;
  onReview?: () => void;
  className?: string;
}

const levelLabels: Record<AuthorizationLevel, string> = {
  0: 'L0 — Read',
  1: 'L1 — Recommend',
  2: 'L2 — Draft',
  3: 'L3 — Execute + Approval',
  4: 'L4 — Controlled Auto',
  5: 'L5 — Prohibited',
};

const riskColors = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export function ApprovalRequest({ action, agent, authorizationLevel, matter, risk = 'medium', evidenceCount = 0, onApprove, onReject, onReview, className }: ApprovalRequestProps) {
  const needsApproval = authorizationLevel >= 2;

  return (
    <Card className={cn('border-yellow-200 bg-yellow-50/50', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="size-4 text-yellow-600" />
            AI Action Requires Approval
          </CardTitle>
          <Badge className={cn('text-[10px]', riskColors[risk])} variant="secondary">
            {risk} risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Action</span>
            <p className="font-medium">{action}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Agent</span>
            <p className="font-medium flex items-center gap-1"><Bot className="size-3" /> {agent}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Authorization</span>
            <p className="font-medium flex items-center gap-1">
              <Shield className="size-3" /> {levelLabels[authorizationLevel]}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Evidence</span>
            <p className="font-medium">{evidenceCount} verified sources</p>
          </div>
          {matter && (
            <div className="col-span-2">
              <span className="text-muted-foreground text-xs">Matter</span>
              <p className="font-medium">{matter}</p>
            </div>
          )}
        </div>

        {needsApproval && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {onReview && (
              <Button variant="outline" size="sm" onClick={onReview} className="gap-1.5">
                <Eye className="size-3.5" /> Review Evidence
              </Button>
            )}
            <div className="flex-1" />
            {onReject && (
              <Button variant="outline" size="sm" onClick={onReject} className="gap-1.5 text-red-600 hover:text-red-700">
                <XCircle className="size-3.5" /> Reject
              </Button>
            )}
            {onApprove && (
              <Button size="sm" onClick={onApprove} className="gap-1.5">
                <CheckCircle className="size-3.5" /> Approve
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
