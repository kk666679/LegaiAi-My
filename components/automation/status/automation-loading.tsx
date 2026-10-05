// components/automation/status/automation-loading.tsx
"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AutomationLoading({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full min-h-[320px] gap-3 p-3", className)} role="status">
      <Skeleton className="hidden w-64 rounded-lg md:block" />
      <div className="relative flex-1 rounded-lg border border-border/60">
        <Skeleton className="absolute inset-0 rounded-lg" />
      </div>
      <Skeleton className="hidden w-80 rounded-lg lg:block" />
    </div>
  );
}
