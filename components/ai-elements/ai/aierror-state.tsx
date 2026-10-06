import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AIErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: string | Error | null;
}

export function AIErrorState({ error, className, children, ...props }: AIErrorStateProps) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Something went wrong.';

  return (
    <div
      role="alert"
      className={cn('rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700', className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">Unable to complete the action</p>
          <p>{message}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
