'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface ConfidenceIndicatorProps {
  level: 'high' | 'medium' | 'low' | 'insufficient';
  evidenceQuality?: string;
  sourcesVerified?: number;
  totalSources?: number;
  missingInfo?: number;
  className?: string;
}

const levelConfig = {
  high: { icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-200', label: 'High Confidence' },
  medium: { icon: Shield, color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-200', label: 'Medium Confidence' },
  low: { icon: ShieldAlert, color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-200', label: 'Low Confidence' },
  insufficient: { icon: ShieldX, color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-200', label: 'Insufficient Evidence' },
};

export function ConfidenceIndicator({ level, evidenceQuality, sourcesVerified, totalSources, missingInfo, className }: ConfidenceIndicatorProps) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg border', config.bg, config.border, className)}>
      <Icon className={cn('size-5', config.color)} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{config.label}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          {evidenceQuality && <span>Evidence: {evidenceQuality}</span>}
          {sourcesVerified !== undefined && totalSources !== undefined && (
            <span>Sources: {sourcesVerified}/{totalSources} verified</span>
          )}
          {missingInfo !== undefined && missingInfo > 0 && (
            <span className="text-orange-600">{missingInfo} missing</span>
          )}
        </div>
      </div>
    </div>
  );
}
