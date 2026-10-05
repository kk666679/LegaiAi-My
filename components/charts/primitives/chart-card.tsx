// components/matters/charts/primitives/chart-card.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChartEmpty, ChartError, ChartLoading } from "./chart-states";

export interface ChartCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  error?: string;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  description,
  action,
  footer,
  loading,
  error,
  empty,
  emptyMessage,
  onRetry,
  height = 240,
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col p-4", className)}>
      {title || action ? (
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            {title ? <p className="truncate text-sm font-medium">{title}</p> : null}
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}

      <div style={{ minHeight: height }} className="relative">
        {loading ? (
          <ChartLoading />
        ) : error ? (
          <ChartError message={error} onRetry={onRetry} />
        ) : empty ? (
          <ChartEmpty message={emptyMessage} />
        ) : (
          children
        )}
      </div>

      {footer ? <div className="mt-3">{footer}</div> : null}
    </Card>
  );
}
