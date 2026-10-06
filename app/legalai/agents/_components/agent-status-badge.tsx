"use client";
// app/legalai/agents/_components/agent-status-badge.tsx
import * as React from "react";
import { AlertCircle, CheckCircle2, Circle, Loader2, Pause, Skull, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgentStatus, RunStatus } from "./types";
import { getAgentStatusTone, getRunStatusTone } from "./use-agents";

const AGENT_ICONS: Record<AgentStatus, React.ReactNode> = {
  idle: <Circle className="size-3" />,
  running: <Loader2 className="size-3 animate-spin" />,
  thinking: <Sparkles className="size-3" />,
  waiting: <Pause className="size-3" />,
  paused: <Pause className="size-3" />,
  error: <AlertCircle className="size-3" />,
  disabled: <Skull className="size-3" />,
};

const RUN_ICONS: Record<RunStatus, React.ReactNode> = {
  queued: <Circle className="size-3" />,
  running: <Loader2 className="size-3 animate-spin" />,
  waiting: <Pause className="size-3" />,
  succeeded: <CheckCircle2 className="size-3" />,
  failed: <AlertCircle className="size-3" />,
  cancelled: <Circle className="size-3" />,
  timeout: <AlertCircle className="size-3" />,
};

export function AgentStatusBadge({
  status,
  compact,
  className,
}: {
  status: AgentStatus;
  compact?: boolean;
  className?: string;
}) {
  const isLive = status === "running" || status === "thinking";
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent gap-1.5 font-medium capitalize",
        getAgentStatusTone(status),
        compact && "px-1.5 py-0 text-[10px]",
        className,
      )}
    >
      {isLive ? (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : (
        AGENT_ICONS[status]
      )}
      {status}
    </Badge>
  );
}

export function RunStatusBadge({
  status,
  compact,
  className,
}: {
  status: RunStatus;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent gap-1.5 font-medium capitalize",
        getRunStatusTone(status),
        compact && "px-1.5 py-0 text-[10px]",
        className,
      )}
    >
      {RUN_ICONS[status]}
      {status}
    </Badge>
  );
}

export function AgentTierBadge({
  tier,
  className,
}: {
  tier: "orchestrator" | "tier1" | "tier2" | "tier3";
  className?: string;
}) {
  const tone =
    tier === "orchestrator"
      ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
      : tier === "tier1"
      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      : tier === "tier2"
      ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
      : "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  const label =
    tier === "orchestrator" ? "Orchestrator" : tier === "tier1" ? "Tier 1" : tier === "tier2" ? "Tier 2" : "Tier 3";
  return (
    <Badge variant="outline" className={cn("border-transparent text-[10px] font-medium", tone, className)}>
      {label}
    </Badge>
  );
}
