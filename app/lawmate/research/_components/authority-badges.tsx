"use client";
// app/lawmate/research/_components/authority-badges.tsx
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AuthorityCourt, AuthorityKind, ResearchStatus } from "./types";
import { AUTHORITY_COURT_LABELS, AUTHORITY_KIND_LABELS } from "./types";

const KIND_TONE: Record<AuthorityKind, string> = {
  case: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  statute: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  regulation: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  "practice-direction": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  secondary: "bg-muted text-muted-foreground",
  treaty: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  constitutional: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  circular: "bg-muted text-muted-foreground",
};

const COURT_TONE: Record<AuthorityCourt, string> = {
  "federal-court": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "court-of-appeal": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "high-court": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "sessions-court": "bg-muted text-muted-foreground",
  "magistrate-court": "bg-muted text-muted-foreground",
  "industrial-court": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  syariah: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  tribunal: "bg-muted text-muted-foreground",
};

export function AuthorityKindBadge({
  kind,
  className,
}: {
  kind: AuthorityKind;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("border-transparent text-[10px] font-medium", KIND_TONE[kind], className)}>
      {AUTHORITY_KIND_LABELS[kind]}
    </Badge>
  );
}

export function AuthorityCourtBadge({
  court,
  className,
}: {
  court: AuthorityCourt;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("border-transparent text-[10px] font-medium", COURT_TONE[court], className)}>
      {AUTHORITY_COURT_LABELS[court]}
    </Badge>
  );
}

export function ResearchStatusBadge({
  status,
  compact,
}: {
  status: ResearchStatus;
  compact?: boolean;
}) {
  const tone =
    status === "complete"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : status === "failed"
      ? "bg-destructive/10 text-destructive"
      : status === "cancelled"
      ? "bg-muted text-muted-foreground line-through"
      : "bg-blue-500/10 text-blue-600 dark:text-blue-400";

  const isLive = status === "running" || status === "reasoning" || status === "queued";

  return (
    <Badge variant="outline" className={cn("border-transparent gap-1.5 font-medium capitalize", tone, compact && "px-1.5 py-0 text-[10px]")}>
      {isLive ? (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {status}
    </Badge>
  );
}
