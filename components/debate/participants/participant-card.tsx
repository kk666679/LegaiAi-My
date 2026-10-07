"use client";

import { Agent, AgentHeader, AgentInstructions } from "@/components/ai-elements/agent";
import { AIBadge } from "@/components/ai/aibadge";
import { AIStatistic } from "@/components/ai/aistatistic";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DebateParticipant } from "@/types/debate";
import {
  ParticipantClassification,
  ParticipantKindBadge,
  ParticipantStatus,
  participantInitials,
} from "./participant-status";
import { Bot, BookMarked, MessageSquareQuote, ScrollText, Wrench } from "lucide-react";

/**
 * Participant presentation.
 *
 * An advocate is composed from `Avatar` + `Badge` + `AIStatusIndicator`; an AI
 * advocate additionally uses `Agent`/`AgentHeader` so it inherits the existing
 * agent visual language (name, model, instructions, tools) rather than a
 * debate-specific imitation of it.
 */

export interface ParticipantCardProps {
  participant: DebateParticipant;
  /** Called when the card is activated. */
  onSelect?: (participant: DebateParticipant) => void;
  /** Emphasise the participant who currently holds the floor. */
  active?: boolean;
  className?: string;
}

/** Compact avatar used in transcripts and turn headers. */
export function ParticipantAvatar({
  participant,
  className,
}: {
  participant: Pick<DebateParticipant, "name" | "initials" | "avatarUrl" | "type">;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-8", className)}>
      {participant.avatarUrl ? (
        <AvatarImage src={participant.avatarUrl} alt="" />
      ) : null}
      <AvatarFallback className="text-[10px] font-medium">
        {participantInitials(participant)}
      </AvatarFallback>
    </Avatar>
  );
}

export function ParticipantCard({
  participant,
  onSelect,
  active,
  className,
}: ParticipantCardProps) {
  const isAi = participant.type === "ai";
  const selectable = typeof onSelect === "function";

  const body = (
    <div
      className={cn(
        "space-y-2.5 rounded-lg border bg-card/50 p-3 transition-colors",
        active && "border-primary/50 bg-primary/5",
        selectable && "hover:bg-muted/50",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <ParticipantAvatar participant={participant} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium">{participant.name}</span>
            {participant.role ? (
              <span className="truncate text-xs text-muted-foreground">{participant.role}</span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <ParticipantKindBadge participant={participant} />
            <ParticipantClassification classification={participant.classification} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ParticipantStatus status={participant.status} />
        {participant.activity ? (
          <span className="truncate text-xs text-muted-foreground">{participant.activity}</span>
        ) : null}
      </div>

      {isAi ? (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          <AIBadge variant="outline" size="sm" rounded="md" icon={<Bot className="size-3" />}>
            {participant.model ?? "Model not configured"}
          </AIBadge>
          {typeof participant.sourcesCount === "number" ? (
            <AIBadge
              variant="outline"
              size="sm"
              rounded="md"
              icon={<BookMarked className="size-3" />}
            >
              {participant.sourcesCount} sources
            </AIBadge>
          ) : null}
          {typeof participant.argumentsCount === "number" ? (
            <AIBadge
              variant="outline"
              size="sm"
              rounded="md"
              icon={<ScrollText className="size-3" />}
            >
              {participant.argumentsCount} arguments
            </AIBadge>
          ) : null}
        </div>
      ) : null}

      {selectable ? (
        <span className="sr-only">
          Open profile for {participant.name}
        </span>
      ) : null}
    </div>
  );

  if (!selectable) return body;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onSelect(participant)}
            className="block w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-pressed={active}
          >
            {body}
          </button>
        </TooltipTrigger>
        <TooltipContent>View {participant.name}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export interface ParticipantProfileProps {
  participant: DebateParticipant;
  className?: string;
}

/**
 * Full participant detail. AI participants reuse `AgentInstructions` and
 * `AgentTools` so an advocate's operating instructions and tool access are
 * expressed with the same primitives used elsewhere in the platform.
 */
export function ParticipantProfile({ participant, className }: ParticipantProfileProps) {
  const isAi = participant.type === "ai";

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-start gap-3">
        <ParticipantAvatar participant={participant} className="size-10" />
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-sm font-semibold">{participant.name}</h3>
          {participant.role ? (
            <p className="text-xs text-muted-foreground">{participant.role}</p>
          ) : null}
          {participant.organisation ? (
            <p className="text-xs text-muted-foreground">{participant.organisation}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <ParticipantKindBadge participant={participant} />
            <ParticipantClassification
              classification={participant.classification}
              showLabel={false}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ParticipantStatus status={participant.status} />
        {participant.activity ? (
          <span className="text-xs text-muted-foreground">{participant.activity}</span>
        ) : null}
      </div>

      {isAi ? (
        <Agent className="rounded-lg border-border/50 bg-card/40">
          <AgentHeader name={participant.role ?? participant.name} model={participant.model} />
          <div className="space-y-3 p-3 pt-0">
            {participant.persona ? (
              <AgentInstructions>{participant.persona}</AgentInstructions>
            ) : null}
            {participant.tools && participant.tools.length > 0 ? (
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Tools</span>
                <ul className="flex flex-wrap gap-1.5">
                  {participant.tools.map((tool) => (
                    <li key={tool}>
                      <AIBadge
                        variant="outline"
                        size="sm"
                        rounded="md"
                        icon={<Wrench className="size-3" aria-hidden />}
                      >
                        {tool}
                      </AIBadge>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Agent>
      ) : null}

      {typeof participant.sourcesCount === "number" || typeof participant.argumentsCount === "number" ? (
        <div className="flex gap-4">
          {typeof participant.sourcesCount === "number" ? (
            <AIStatistic
              label="Sources"
              value={participant.sourcesCount}
              size="sm"
              icon={<BookMarked className="size-3" aria-hidden />}
            />
          ) : null}
          {typeof participant.argumentsCount === "number" ? (
            <AIStatistic
              label="Arguments"
              value={participant.argumentsCount}
              size="sm"
              icon={<MessageSquareQuote className="size-3" aria-hidden />}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Tool listing row for `AgentTools`.
 *
 * `AgentTool` renders a JSON schema and needs a `Tool` object from the AI SDK,
 * which a debate configuration does not carry. This renders the same tool
 * disclosure affordance without inventing a schema.
 */
function AgentToolStub({ name }: { name: string }) {
  return (
    <li className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <MessageSquareQuote className="size-3.5 text-muted-foreground" aria-hidden />
      {name}
    </li>
  );
}

export interface JudgeCardProps {
  participant: DebateParticipant;
  className?: string;
}

/**
 * Bench participant. Separated visually because a judge is neither an advocate
 * nor a party and must never read as holding a side.
 */
export function JudgeCard({ participant, className }: JudgeCardProps) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border border-dashed bg-muted/30 p-3",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <ParticipantAvatar participant={participant} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium">{participant.name}</span>
            <Badge variant="outline" className="text-[10px]">
              Bench
            </Badge>
          </div>
          {participant.role ? (
            <p className="truncate text-xs text-muted-foreground">{participant.role}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ParticipantStatus status={participant.status} />
        {participant.model ? (
          <Badge variant="secondary" className="font-mono text-[10px]">
            {participant.model}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
