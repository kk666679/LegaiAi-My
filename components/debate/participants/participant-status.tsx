"use client";

import { AIBadge } from "@/components/ai/aibadge";
import { AIStatusIndicator } from "@/components/ai/aistatus-indicator";
import { ClassificationIndicator } from "@/components/ai/legal/classification";
import { cn } from "@/lib/utils";
import type { DebateParticipant, DebateParticipantStatus } from "@/types/debate";
import { DEBATE_PARTICIPANT_LABELS, DEBATE_SIDE_LABELS } from "@/types/debate";
import { Bot, Gavel, Eye, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Participant presence and identity indicators.
 *
 * Composition only — identity uses `AIBadge`, presence uses
 * `AIStatusIndicator`, and data-classification gating uses
 * `ClassificationIndicator`. No debate-specific badge or status system is
 * introduced here.
 */

const PRESENCE: Record<
  DebateParticipantStatus,
  { status: Parameters<typeof AIStatusIndicator>[0]["status"]; label: string }
> = {
  idle: { status: "idle", label: "Idle" },
  thinking: { status: "busy", label: "Thinking" },
  speaking: { status: "online", label: "Speaking" },
  researching: { status: "syncing", label: "Researching" },
  reviewing: { status: "pending", label: "Reviewing" },
  finished: { status: "success", label: "Finished" },
  offline: { status: "offline", label: "Offline" },
};

const TYPE_ICON: Record<DebateParticipant["type"], LucideIcon> = {
  human: User,
  ai: Bot,
  judge: Gavel,
  observer: Eye,
};

export interface ParticipantStatusProps {
  status?: DebateParticipantStatus;
  className?: string;
}

/** Current activity of one participant. */
export function ParticipantStatus({ status = "idle", className }: ParticipantStatusProps) {
  const view = PRESENCE[status];
  return (
    <AIStatusIndicator
      status={view.status}
      label={view.label}
      size="sm"
      showPulse={status === "speaking" || status === "researching"}
      className={className}
    />
  );
}

export interface ParticipantKindBadgeProps {
  participant: Pick<DebateParticipant, "type" | "side">;
  className?: string;
}

/** Human / AI / Judge / Observer badge, with the side as a separate chip. */
export function ParticipantKindBadge({ participant, className }: ParticipantKindBadgeProps) {
  const Icon = TYPE_ICON[participant.type];
  const label = DEBATE_PARTICIPANT_LABELS[participant.type];
  const variant =
    participant.type === "ai"
      ? "info"
      : participant.type === "judge"
        ? "secondary"
        : participant.type === "observer"
          ? "outline"
          : "default";

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <AIBadge variant={variant} size="sm" rounded="md" icon={<Icon className="size-3" />}>
        {label}
      </AIBadge>
      {participant.side !== "neutral" ? (
        <AIBadge variant="outline" size="sm" rounded="md">
          {DEBATE_SIDE_LABELS[participant.side]}
        </AIBadge>
      ) : null}
    </span>
  );
}

export interface ParticipantClassificationProps {
  classification?: DebateParticipant["classification"];
  /** Show the permitted-models suffix. Defaults to hidden in dense layouts. */
  showLabel?: boolean;
  className?: string;
}

/**
 * Data classification for a participant's material. Privileged material is
 * embeddings-only, so the permitted-model suffix matters — it is opt-in so
 * dense layouts can hide it without losing the classification itself.
 */
export function ParticipantClassification({
  classification,
  showLabel = false,
  className,
}: ParticipantClassificationProps) {
  if (!classification) return null;
  return (
    <ClassificationIndicator
      classification={classification}
      className={className}
      showLabel={showLabel}
    />
  );
}

/** Initials used by `AvatarFallback` when a participant has no image. */
export function participantInitials(participant: Pick<DebateParticipant, "name" | "initials">) {
  if (participant.initials) return participant.initials;
  return participant.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
