'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Bot, Clock, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';

type AgentStatus = 'queued' | 'running' | 'retrieving' | 'analyzing' | 'drafting' | 'validating' | 'awaiting_approval' | 'completed' | 'failed' | 'cancelled';

interface AgentStep {
  name: string;
  status: AgentStatus;
  description?: string;
  duration?: string;
}

interface AgentTimelineProps {
  steps: AgentStep[];
  className?: string;
}

const statusConfig: Record<AgentStatus, { icon: typeof Bot; color: string; label: string }> = {
  queued: { icon: Clock, color: 'text-muted-foreground', label: 'Queued' },
  running: { icon: Loader, color: 'text-blue-600 animate-spin', label: 'Running' },
  retrieving: { icon: Loader, color: 'text-blue-600 animate-spin', label: 'Retrieving' },
  analyzing: { icon: Loader, color: 'text-purple-600 animate-spin', label: 'Analyzing' },
  drafting: { icon: Loader, color: 'text-indigo-600 animate-spin', label: 'Drafting' },
  validating: { icon: Loader, color: 'text-cyan-600 animate-spin', label: 'Validating' },
  awaiting_approval: { icon: AlertCircle, color: 'text-yellow-600', label: 'Awaiting Approval' },
  completed: { icon: CheckCircle, color: 'text-green-600', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-600', label: 'Failed' },
  cancelled: { icon: XCircle, color: 'text-muted-foreground', label: 'Cancelled' },
};

export function AgentTimeline({ steps, className }: AgentTimelineProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {steps.map((step, idx) => {
        const config = statusConfig[step.status];
        const Icon = config.icon;
        return (
          <div key={idx} className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
            <Icon className={cn('size-4 shrink-0', config.color)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{step.name}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{config.label}</Badge>
                {step.duration && <span className="text-[10px] text-muted-foreground">{step.duration}</span>}
              </div>
              {step.description && <p className="text-xs text-muted-foreground truncate">{step.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
