// components/hitl/status/hitl-loading.tsx
"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface HITLLoadingProps {
  variant?: "list" | "detail";
  rows?: number;
  className?: string;
}

export function HITLLoading({ variant = "list", rows = 6, className }: HITLLoadingProps) {
  if (variant === "detail") {
    return (
      <div
        className={cn("grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[1fr_400px]", className)}
        role="status"
      >
        <div className="space-y-3">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-full" />
      </div>
    );
  }
  return (
    <div
      className={cn("space-y-2 p-4", className)}
      role="status"
      aria-label="Loading review queue"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-md border border-border/60 p-3"
        >
          <Skeleton className="size-8 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}