'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

interface InsufficientEvidenceProps {
  searched?: string[];
  missing?: string[];
  suggestedActions?: string[];
  variant?: 'default' | 'classification' | 'auth';
  className?: string;
}

export function InsufficientEvidence({ searched = [], missing = [], suggestedActions = [], variant = 'default', className }: InsufficientEvidenceProps) {
  return (
    <Card className={cn('border-orange-200 bg-orange-50/50', variant === 'classification' && 'border-red-200 bg-red-50/50', variant === 'auth' && 'border-yellow-200 bg-yellow-50/50', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {variant === 'classification' ? <AlertCircle className="size-4 text-red-600" /> : <Info className="size-4 text-orange-600" />}
          {variant === 'classification' ? 'Model Restriction' : variant === 'auth' ? 'Authorization Required' : 'Insufficient Verified Evidence'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {variant === 'default' && (
          <>
            {searched.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">What was searched</p>
                <div className="flex flex-wrap gap-1">
                  {searched.map((s, i) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}
                </div>
              </div>
            )}
            {missing.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Missing information</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {missing.map((m, i) => <li key={i}>• {m}</li>)}
                </ul>
              </div>
            )}
          </>
        )}
        {variant === 'classification' && (
          <p className="text-xs text-red-700">The matter contains information classified above the selected model&apos;s permitted level.</p>
        )}
        {variant === 'auth' && (
          <p className="text-xs text-yellow-700">Your current role does not authorize this action.</p>
        )}
        {suggestedActions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Suggested actions</p>
            <ul className="text-xs space-y-0.5">
              {suggestedActions.map((a, i) => <li key={i} className="flex items-center gap-1"><CheckCircle className="size-3 text-green-600" /> {a}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
