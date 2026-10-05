"use client";

import { Input } from "@/components/ui/input";
import { ParticipantCard, ParticipantProfile, JudgeCard, ParticipantAvatar } from "./participant-card";
import { ParticipantKindBadge, ParticipantStatus } from "./participant-status";
import { cn } from "@/lib/utils";
import type { DebateParticipant, DebateSide } from "@/types/debate";
import { Search } from "lucide-react";

export interface ParticipantListProps {
  participants: DebateParticipant[];
  onSelect?: (participant: DebateParticipant) => void;
  activeId?: string;
  /** Show only one side, or all. */
  side?: DebateSide | "all";
  className?: string;
}

function matchesSide(participant: DebateParticipant, side: ParticipantListProps["side"]) {
  if (side === "all" || side === undefined) return true;
  return participant.side === side || (side === "neutral" && participant.side === "neutral");
}

export function ParticipantList({ participants, onSelect, activeId, side, className }: ParticipantListProps) {
  const filtered = participants.filter((p) => matchesSide(p, side));

  return (
    <div className={cn("space-y-3", className)}>
      {filtered.map((participant) => {
        const isJudge = participant.side === "neutral" && participant.type === "judge";
        return (
          <div key={participant.id} className="space-y-1">
            {isJudge ? (
              <JudgeCard participant={participant} />
            ) : (
              <ParticipantCard
                participant={participant}
                onSelect={onSelect}
                active={participant.id === activeId}
              />
            )}
          </div>
        );
      })}

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">No participants on this side yet.</p>
      ) : null}
    </div>
  );
}

export interface ParticipantListHeaderProps {
  title?: string;
  description?: string;
  className?: string;
}

export function ParticipantListHeader({ title, description, className }: ParticipantListHeaderProps) {
  return (
    <div className={cn("space-y-0.5", className)}>
      {title ? <h3 className="text-sm font-semibold">{title}</h3> : null}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}
