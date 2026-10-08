// components/matters/charts/primitives/chart-states.tsx
"use client";

import * as React from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ChartEmpty({
  message = "No data available",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex h-full flex-col items-center justify-center gap-2 text-muted-foreground",
        className,
      )}
    >
      <BarChart3 className="size-6 opacity-40" aria-hidden />
      <p className="text-xs">{message}</p>
    </div>
  );
}

export function ChartLoading({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading chart"
      className={cn("flex h-full flex-col justify-end gap-2", className)}
    >
      <Skeleton className="h-full w-full rounded-md" />
    </div>
  );
}

export function ChartError({
  message = "Couldn't load chart",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex h-full flex-col items-center justify-center gap-2 text-center",
        className,
      )}
    >
      <p className="text-xs text-destructive">{message}</p>
      {onRetry ? (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={onRetry}>
          <RefreshCw className="size-3.5" /> Retry
        </Button>
      ) : null}
    </div>
  );
}
