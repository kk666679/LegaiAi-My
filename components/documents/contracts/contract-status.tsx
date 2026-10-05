"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  negotiation: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  expiring: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  expired: "bg-muted text-muted-foreground",
  terminated: "bg-destructive/10 text-destructive",
};

export function ContractStatus({ status }: { status: string }) {
  return <Badge variant="outline" className={cn("border-transparent text-[10px] font-medium capitalize", TONE[status] ?? "bg-muted text-muted-foreground")}>{status}</Badge>;
}
