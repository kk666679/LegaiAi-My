"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AILiveBadge } from "@/components/lawmate/ai/ailive-badge";
import { DebateLiveState, isDebateActive } from "../core/debate-status";
import { DebateProgressInline } from "../core/debate-status";
import { cn } from "@/lib/utils";
import type { DebateRound } from "@/types/debate";
import { DEBATE_ROUND_LABELS, DEBATE_ROUND_TYPES } from "@/types/debate";
import { CheckCircle2, Clock, Gavel, MessageSquare, ShieldQuestion } from "lucide-react";

export interface DebateRoundsProps {
  rounds: DebateRound[];
  activeId?: string;
  className?: string;
}

const ICON: Record<DebateRound["type"], typeof MessageSquare> = {
  opening: MessageSquare,
  argument: MessageSquare,
  counterargument: MessageSquare,
  rebuttal: MessageSquare,
  "cross-examination": ShieldQuestion,
  closing: MessageSquare,
  judgment: Gavel,
};

export function DebateRounds({ rounds, activeId, className }: DebateRoundsProps) {
  const total = rounds.length;
  const completed = rounds.filter((r) => r.status === "completed").length;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Rounds</span>
        <DebateProgressInline completed={completed} total={total} />
      </div>
      <div className="space-y-1.5">
        {rounds.map((round) => {
          const Icon = ICON[round.type] ?? MessageSquare;
          const isActive = round.status === "active";
          const isComplete = round.status === "completed";
          return (
            <button
              key={round.id}
              type="button"
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
                isActive
                  ? "border-primary/60 bg-primary/5"
                  : "border-border hover:bg-muted/40",
                round.id === activeId && "ring-1 ring-ring",
              )}
            >
              <Icon className={cn("size-3.5 shrink-0", isComplete ? "text-emerald-500" : isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="min-w-0 flex-1 truncate text-xs font-medium">
                {round.title ?? DEBATE_ROUND_LABELS[round.type]}
              </span>
              {isComplete ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
              ) : isActive ? (
                <Clock className="size-3.5 shrink-0 text-primary animate-pulse" />
              ) : (
                <Clock className="size-3 shrink-0 text-muted-foreground/60" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface RoundProgressProps {
  rounds: DebateRound[];
  className?: string;
}

export function RoundProgress({ rounds, className }: RoundProgressProps) {
  const total = rounds.length;
  const completed = rounds.filter((r) => r.status === "completed").length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Progress value={pct} className="h-1.5" />
      <span className="text-[10px] text-muted-foreground">
        {completed}/{total} rounds completed
      </span>
    </div>
  );
}
