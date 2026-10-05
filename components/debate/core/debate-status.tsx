"use client";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { AILiveBadge } from "@/components/lawmate/ai/ailive-badge";
import { AIStatusIndicator } from "@/components/lawmate/ai/aistatus-indicator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DebateStatus } from "@/types/debate";
import { DEBATE_STATUS_LABELS } from "@/types/debate";
import { Loader2, TriangleAlert } from "lucide-react";

/**
 * Debate status presentation.
 *
 * There is no second badge system here — this module only maps the debate
 * lifecycle onto `StatusBadge` (for the state itself), `AILiveBadge` and
 * `AIStatusIndicator` (for live agent activity). Colour is never the only
 * signal: every variant renders its label.
 */

interface StatusView {
  /** Value understood by `StatusBadge`'s tone table. */
  value: string;
  label: string;
}

const STATUS_VIEWS: Record<DebateStatus, StatusView> = {
  draft: { value: "draft", label: DEBATE_STATUS_LABELS.draft },
  setup: { value: "in_progress", label: DEBATE_STATUS_LABELS.setup },
  ready: { value: "ready", label: DEBATE_STATUS_LABELS.ready },
  running: { value: "active", label: DEBATE_STATUS_LABELS.running },
  paused: { value: "on_hold", label: DEBATE_STATUS_LABELS.paused },
  waiting: { value: "pending", label: DEBATE_STATUS_LABELS.waiting },
  reviewing: { value: "review", label: DEBATE_STATUS_LABELS.reviewing },
  completed: { value: "completed", label: DEBATE_STATUS_LABELS.completed },
  cancelled: { value: "closed", label: DEBATE_STATUS_LABELS.cancelled },
  error: { value: "critical", label: DEBATE_STATUS_LABELS.error },
};

/** Statuses where the debate is still advancing. */
const ACTIVE_STATUSES: DebateStatus[] = ["running", "waiting", "reviewing"];

/** Whether the given status represents a live debate. */
export function isDebateActive(status: DebateStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export interface DebateStatusBadgeProps {
  status: DebateStatus;
  /** Overrides the default label. */
  label?: string;
  className?: string;
}

/** The debate lifecycle badge. Reuses the shared status badge. */
export function DebateStatusBadge({ status, label, className }: DebateStatusBadgeProps) {
  const view = STATUS_VIEWS[status];
  return (
    <StatusBadge
      value={view.value}
      label={label ?? view.label}
      className={cn("uppercase tracking-wide", className)}
    />
  );
}

export interface DebateLiveStateProps {
  status: DebateStatus;
  /** Hides the text label when a nearby badge already names the state. */
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Live/paused indicator for a debate. Delegates to `AILiveBadge` and
 * `AIStatusIndicator` rather than introducing another pulsing dot.
 */
export function DebateLiveState({
  status,
  showLabel = true,
  size = "sm",
  className,
}: DebateLiveStateProps) {
  switch (status) {
    case "running":
      return <AILiveBadge status="active" size={size} showLabel={showLabel} className={className} />;
    case "waiting":
      return <AILiveBadge status="syncing" size={size} showLabel={showLabel} className={className} />;
    case "reviewing":
      return (
        <AILiveBadge status="analyzing" size={size} showLabel={showLabel} className={className} />
      );
    case "paused":
      return (
        <AILiveBadge
          status="paused"
          pulse={false}
          size={size}
          showLabel={showLabel}
          className={className}
        />
      );
    case "error":
      return (
        <AILiveBadge status="error" pulse={false} size={size} showLabel={showLabel} className={className} />
      );
    case "completed":
      return (
        <AIStatusIndicator
          status="success"
          size={size}
          label={DEBATE_STATUS_LABELS.completed}
          showLabel={showLabel}
          className={className}
        />
      );
    case "cancelled":
      return (
        <AIStatusIndicator
          status="offline"
          size={size}
          label={DEBATE_STATUS_LABELS.cancelled}
          showLabel={showLabel}
          className={className}
        />
      );
    default:
      return (
        <AIStatusIndicator
          status="idle"
          size={size}
          label={DEBATE_STATUS_LABELS[status]}
          showPulse={false}
          showLabel={showLabel}
          className={className}
        />
      );
  }
}

export interface DebateSimulatedNoticeProps {
  /** Set on demo/seed debates. */
  simulated?: boolean;
  className?: string;
}

/**
 * Marks a debate as simulated. Any debate assembled from demo or seed data
 * must carry this so simulated authorities are never mistaken for real ones.
 */
export function DebateSimulatedNotice({ simulated, className }: DebateSimulatedNoticeProps) {
  if (!simulated) return null;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex cursor-help items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600",
              className,
            )}
          >
            <TriangleAlert className="size-3" aria-hidden />
            SIMULATED
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Demonstration data. Authorities shown here are illustrative placeholders, not real
          citations.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export interface DebateProgressInlineProps {
  completed: number;
  total: number;
  className?: string;
}

/** Small "3 / 6 rounds" line used in headers. Keeps the round bar out of headers. */
export function DebateProgressInline({ completed, total, className }: DebateProgressInlineProps) {
  if (total <= 0) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
      {completed < total ? (
        <Loader2 className="size-3 animate-spin" aria-hidden />
      ) : null}
      <span>
        {completed}/{total} rounds
      </span>
    </span>
  );
}
