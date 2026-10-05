"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDebate } from "@/hooks/useDebate";
import { DebateWorkspace } from "./debate-workspace";
import type { Debate, DebateParticipantStatus } from "@/types/debate";
import { Pause, Play, RotateCcw, Square } from "lucide-react";

/**
 * Simulated debate preview for the setup page.
 *
 * Replays the clearly-labelled simulated Malaysian contract dispute
 * from `hooks/useDebate` through the same `DebateWorkspace` the job
 * page uses, so every debate component is exercised end-to-end.
 *
 * The view is playback-coherent: arguments, evidence and
 * cross-examination only appear once the round that delivers them
 * has played, and participant presence follows the live entry.
 */
export interface DebatePreviewProps {
  className?: string;
}

export function DebatePreview({ className }: DebatePreviewProps) {
  const {
    debate,
    status,
    startDebate,
    pause,
    resume,
    reset,
    debateStarted,
    loading,
  } = useDebate();

  /** Round ids that have delivered at least one entry. */
  const revealedRoundIds = useMemo(
    () =>
      new Set(
        debate.rounds
          .filter((round) => round.status !== "pending")
          .map((round) => round.id),
      ),
    [debate.rounds],
  );

  /** Arguments limited to the rounds that have played. */
  const visibleArguments = useMemo(
    () =>
      (debate.arguments ?? []).filter(
        (argument) =>
          argument.roundId === undefined ||
          revealedRoundIds.has(argument.roundId),
      ),
    [debate.arguments, revealedRoundIds],
  );

  /** Evidence referenced by the arguments that have played. */
  const visibleEvidence = useMemo(() => {
    const ids = new Set(
      visibleArguments.flatMap((argument) => argument.evidenceIds ?? []),
    );
    return (debate.evidence ?? []).filter((item) => ids.has(item.id));
  }, [debate.evidence, visibleArguments]);

  /** Cross-examination limited to the rounds that have played. */
  const visibleExaminations = useMemo(
    () =>
      (debate.examinations ?? []).filter(
        (item) =>
          item.roundId === undefined || revealedRoundIds.has(item.roundId),
      ),
    [debate.examinations, revealedRoundIds],
  );

  /** Presence follows the most recent delivered entry. */
  const liveParticipants = useMemo(() => {
    const lastEntry = debate.entries[debate.entries.length - 1];
    const spoken = new Set(debate.entries.map((entry) => entry.participantId));
    return debate.participants.map((participant) => {
      let statusValue: DebateParticipantStatus = "idle";
      if (lastEntry && participant.id === lastEntry.participantId) {
        statusValue = "speaking";
      } else if (spoken.has(participant.id)) {
        statusValue = "finished";
      }
      return { ...participant, status: statusValue };
    });
  }, [debate.entries, debate.participants]);

  const visibleDebate: Debate = useMemo(
    () => ({
      ...debate,
      participants: liveParticipants,
      arguments: visibleArguments,
      evidence: visibleEvidence,
      examinations: visibleExaminations,
    }),
    [debate, liveParticipants, visibleArguments, visibleEvidence, visibleExaminations],
  );

  const playing = status === "running" || status === "waiting";

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="size-4 text-primary" aria-hidden />
              Full workspace preview
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              A simulated contract dispute replayed through the same
              workspace a live debate uses. Demonstration data only —
              authorities shown are illustrative placeholders.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!debateStarted || status === "completed" ? (
              <Button size="sm" variant="default" onClick={startDebate}>
                <Play className="size-3.5" aria-hidden />
                {debateStarted ? "Replay" : "Run simulated debate"}
              </Button>
            ) : null}
            {playing ? (
              <Button size="sm" variant="outline" onClick={pause}>
                <Pause className="size-3.5" aria-hidden />
                Pause
              </Button>
            ) : null}
            {status === "paused" ? (
              <Button size="sm" variant="outline" onClick={resume}>
                <Play className="size-3.5" aria-hidden />
                Resume
              </Button>
            ) : null}
            {debateStarted ? (
              <Button size="sm" variant="ghost" onClick={reset}>
                {status === "paused" ? (
                  <Square className="size-3.5" aria-hidden />
                ) : (
                  <RotateCcw className="size-3.5" aria-hidden />
                )}
                Reset
              </Button>
            ) : null}
            {loading ? (
              <span className="text-xs text-muted-foreground">
                Debate in progress…
              </span>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!debateStarted && status === "setup" ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Press <span className="font-medium">Run simulated debate</span> to
            watch the workspace stream a simulated debate — participants,
            round plan, arguments, cross-examination, evidence, scoring and
            the AI assessment.
          </p>
        ) : (
          <DebateWorkspace debate={visibleDebate} />
        )}
      </CardContent>
    </Card>
  );
}
