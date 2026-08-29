'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Classification = 'public' | 'internal' | 'confidential' | 'privileged';

interface ClassificationIndicatorProps {
  classification: Classification;
  className?: string;
  showLabel?: boolean;
}

const config: Record<Classification, { color: string; label: string; models: string }> = {
  public: { color: 'bg-green-100 text-green-800 border-green-200', label: 'PUBLIC', models: 'All permitted models' },
  internal: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'INTERNAL', models: 'Approved models only' },
  confidential: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'CONFIDENTIAL', models: 'Local-only approved models' },
  privileged: { color: 'bg-red-100 text-red-800 border-red-200', label: 'PRIVILEGED', models: 'Local embeddings / permitted processing only' },
};

export function ClassificationIndicator({ classification, className, showLabel = true }: ClassificationIndicatorProps) {
  const c = config[classification];
  return (
    <Badge className={cn('text-[10px] font-semibold border', c.color, className)} variant="outline">
      {c.label}
      {showLabel && <span className="font-normal ml-1 opacity-70">· {c.models}</span>}
    </Badge>
  );
}
