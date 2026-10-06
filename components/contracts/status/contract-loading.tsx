"use client";
import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ContractLoading({ variant = "grid", rows = 6, className }: { variant?: "list" | "grid" | "table"; rows?: number; className?: string }) {
  if (variant === "table") {
    return <div className={cn("space-y-2 p-4", className)} role="status" aria-label="Loading contracts">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="flex items-center gap-3"><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" /></div>)}
    </div>;
  }
  if (variant === "list") {
    return <div className={cn("space-y-2 p-4", className)} role="status">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="flex items-center gap-3 rounded-md border border-border/60 p-3"><Skeleton className="size-10 rounded" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-2/3" /></div></div>)}
    </div>;
  }
  return <div className={cn("grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3", className)} role="status">
    {Array.from({ length: rows }).map((_, i) => <div key={i} className="space-y-3 rounded-lg border border-border/60 p-4"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/3" /></div>)}
  </div>;
}
