"use client";

import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactContent,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { ClassificationIndicator } from "@/components/lawmate/ai/legal/classification";
import { ConfidenceIndicator } from "@/components/lawmate/ai/legal/confidence";
import {
  DebateLiveState,
  DebateProgressInline,
  DebateSimulatedNotice,
  DebateStatusBadge,
} from "../core/debate-status";
import {
  ParticipantList,
  ParticipantListHeader,
} from "../participants/participant-list";
import { ParticipantProfile } from "../participants/participant-card";
import { DebateRounds, RoundProgress } from "../rounds/round-list";
import { ArgumentList } from "../arguments/argument-list";
import { ArgumentCard } from "../arguments/argument-card";
import { DebateEvidencePanel } from "../evidence/debate-evidence-panel";
import { DebateReasoning } from "../reasoning/debate-reasoning";
import { CrossExamination } from "../cross-examination/cross-examination";
import { DebateScoreboard, MomentumIndicator } from "../scoring/scoreboard";
import { DebateTranscript } from "../transcript/transcript";
import { copyToClipboard, cn } from "@/lib/utils";
import type { Debate, DebateSide, DebateVerdict, DebateVerdictBasis } from "@/types/debate";
import { DEBATE_SIDE_LABELS } from "@/types/debate";
import {
  CheckCircle2,
  Copy,
  Download,
  Gavel,
  ListChecks,
  Scale,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

/**
 * Full debate workspace.
 *
 * Renders a `Debate` aggregate entirely with the
 * `components/debate/**` primitives — participants, round plan,
 * arguments, cross-examination, evidence, reasoning, scoring and
 * transcript — plus the `ai-elements` primitives for the
 * assessment (Artifact, Reasoning, ChainOfThought, Sources).
 *
 * Sections render only when the aggregate carries their data, so
 * a live job shows the plan and participants while the worker
 * runs and the analysis sections appear once delivered. Nothing
 * is invented: scores, momentum, examinations and evidence stay
 * hidden until the debate provides them.
 */

const BASIS_LABELS: Record<DebateVerdictBasis, string> = {
  "ai-evaluation": "AI evaluation",
  "user-scoring": "User scoring",
  "judicial-assessment": "Judicial assessment",
};

const OUTCOME_LABELS: Record<DebateVerdict["outcome"], string> = {
  proponent: "Proponent position stronger",
  opponent: "Opponent position stronger",
  draw: "No clear winner",
  undecided: "No winner declared",
};

function confidenceLevel(
  confidence: number,
): "high" | "medium" | "low" | "insufficient" {
  return confidence >= 0.8
    ? "high"
    : confidence >= 0.6
      ? "medium"
      : confidence >= 0.35
        ? "low"
        : "insufficient";
}

export interface DebateWorkspaceProps {
  debate: Debate;
  className?: string;
}

export function DebateWorkspace({ debate, className }: DebateWorkspaceProps) {
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [sideFilter, setSideFilter] = useState<DebateSide | "all">("all");

  const completedRounds = debate.rounds.filter(
    (round) => round.status === "completed",
  ).length;
  const activeRound = debate.rounds.find((round) => round.status === "active");

  const arguments_ = debate.arguments ?? [];
  const evidence = debate.evidence ?? [];
  const sources = debate.sources ?? [];
  const examinations = debate.examinations ?? [];
  const scores = debate.scores ?? [];
  const momentum = debate.momentum;
  const verdict = debate.verdict;

  const selectedParticipant = debate.participants.find(
    (participant) => participant.id === selectedParticipantId,
  );

  const strongestArgument = useMemo(() => {
    if (!verdict?.strongestArgumentId) return null;
    return (
      arguments_.find((argument) => argument.id === verdict.strongestArgumentId) ??
      null
    );
  }, [arguments_, verdict?.strongestArgumentId]);

  const linkedEvidence = useMemo(() => {
    const ids = new Set(
      arguments_.flatMap((argument) => argument.evidenceIds ?? []),
    );
    return evidence.filter((item) => ids.has(item.id));
  }, [arguments_, evidence]);

  const crossExaminationParticipants = useMemo(() => {
    const map: Record<string, { name: string; side: DebateSide }> = {};
    debate.participants.forEach((participant) => {
      map[participant.id] = { name: participant.name, side: participant.side };
    });
    return map;
  }, [debate.participants]);

  const urlSources = useMemo(
    () => sources.filter((source) => Boolean(source.url)),
    [sources],
  );

  const handleCopyAssessment = () => {
    if (verdict?.summary) copyToClipboard(verdict.summary);
  };

  const handleDownloadAssessment = () => {
    if (!verdict?.summary) return;
    const blob = new Blob([verdict.summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `debate-assessment-${debate.id}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* ── Status row ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <DebateStatusBadge status={debate.status} />
        <DebateLiveState status={debate.status} />
        <DebateProgressInline
          completed={completedRounds}
          total={debate.rounds.length}
        />
        {activeRound ? (
          <Badge variant="outline" className="text-[10px]">
            Now: {activeRound.title ?? activeRound.type}
          </Badge>
        ) : null}
        {debate.simulated ? <DebateSimulatedNotice simulated /> : null}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Main column ──────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          {/* Issue */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Scale className="size-3.5" aria-hidden />
                Question submitted
              </div>
              <CardTitle className="text-balance">
                {debate.issue.title ?? debate.title}
              </CardTitle>
              {debate.issue.jurisdiction ? (
                <CardDescription>{debate.issue.jurisdiction}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {debate.issue.statement ?? debate.title}
              </p>
              {debate.issue.applicableLaw &&
              debate.issue.applicableLaw.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {debate.issue.applicableLaw.map((law) => (
                    <Badge key={law} variant="secondary" className="text-[10px]">
                      {law}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {debate.issue.classification ? (
                <ClassificationIndicator
                  classification={debate.issue.classification}
                  className="text-[10px]"
                />
              ) : null}
            </CardContent>
          </Card>

          {/* Assessment */}
          {verdict ? (
            <Artifact>
              <ArtifactHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Gavel className="size-4 text-primary" aria-hidden />
                  <ArtifactTitle>AI assessment</ArtifactTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {BASIS_LABELS[verdict.basis]}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {OUTCOME_LABELS[verdict.outcome]}
                  </Badge>
                  {verdict.confidence > 0 ? (
                    <ConfidenceIndicator
                      level={confidenceLevel(verdict.confidence)}
                      className="border-0 bg-transparent p-0"
                    />
                  ) : null}
                </div>
                <ArtifactActions>
                  <ArtifactAction
                    tooltip="Copy assessment"
                    onClick={handleCopyAssessment}
                  >
                    <Copy className="size-4" />
                  </ArtifactAction>
                  <ArtifactAction
                    tooltip="Download assessment"
                    onClick={handleDownloadAssessment}
                  >
                    <Download className="size-4" />
                  </ArtifactAction>
                </ArtifactActions>
              </ArtifactHeader>
              <ArtifactContent className="space-y-4">
                {verdict.summary ? (
                  <Reasoning defaultOpen>
                    <ReasoningTrigger>Assessment rationale</ReasoningTrigger>
                    <ReasoningContent>{verdict.summary}</ReasoningContent>
                  </Reasoning>
                ) : null}

                {verdict.keyReasons && verdict.keyReasons.length > 0 ? (
                  <ChainOfThought defaultOpen>
                    <ChainOfThoughtHeader>
                      Basis for the assessment
                    </ChainOfThoughtHeader>
                    <ChainOfThoughtContent>
                      {verdict.keyReasons.map((reason, index) => (
                        <ChainOfThoughtStep
                          key={index}
                          icon={CheckCircle2}
                          label={reason}
                          status="complete"
                        />
                      ))}
                    </ChainOfThoughtContent>
                  </ChainOfThought>
                ) : null}

                {verdict.weaknesses && verdict.weaknesses.length > 0 ? (
                  <Alert>
                    <ShieldAlert className="size-4" aria-hidden />
                    <AlertTitle>Limitations</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc space-y-0.5 pl-5 text-xs">
                        {verdict.weaknesses.map((weakness, index) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : null}

                {verdict.recommendations &&
                verdict.recommendations.length > 0 ? (
                  <div className="space-y-2">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <ListChecks className="size-4 text-primary" aria-hidden />
                      Recommended next steps
                    </span>
                    <ul className="space-y-1.5">
                      {verdict.recommendations.map((recommendation, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2
                            className="mt-0.5 size-3.5 shrink-0 text-emerald-500"
                            aria-hidden
                          />
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {verdict.disclaimer ? (
                  <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-relaxed text-muted-foreground">
                    {verdict.disclaimer}
                  </p>
                ) : null}

                {urlSources.length > 0 ? (
                  <Sources>
                    <SourcesTrigger count={urlSources.length}>
                      Authorities consulted
                    </SourcesTrigger>
                    <SourcesContent>
                      {urlSources.map((source) => (
                        <Source
                          key={source.id}
                          href={source.url}
                          title={source.title}
                        >
                          {source.citation ?? source.title}
                        </Source>
                      ))}
                    </SourcesContent>
                  </Sources>
                ) : null}
              </ArtifactContent>
            </Artifact>
          ) : null}

          {/* Strongest argument */}
          {strongestArgument ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" aria-hidden />
                  <CardTitle className="text-sm">Strongest argument</CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {DEBATE_SIDE_LABELS[strongestArgument.side]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ArgumentCard argument={strongestArgument} />
                <DebateReasoning
                  argument={strongestArgument}
                  missingInfo={strongestArgument.weaknesses ?? []}
                />
              </CardContent>
            </Card>
          ) : null}

          {/* Arguments */}
          {arguments_.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm">Arguments</CardTitle>
                    <CardDescription>
                      Opposing submissions as delivered, in transcript order.
                    </CardDescription>
                  </div>
                  <Tabs
                    value={sideFilter}
                    onValueChange={(value) =>
                      setSideFilter(value as DebateSide | "all")
                    }
                  >
                    <TabsList>
                      <TabsTrigger value="all">All sides</TabsTrigger>
                      <TabsTrigger value="proponent">
                        {DEBATE_SIDE_LABELS.proponent}
                      </TabsTrigger>
                      <TabsTrigger value="opponent">
                        {DEBATE_SIDE_LABELS.opponent}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <TabsContent value={sideFilter} className="mt-0">
                  <ArgumentList arguments={arguments_} side={sideFilter} />
                </TabsContent>
              </CardContent>
            </Card>
          ) : null}

          {/* Cross-examination */}
          {examinations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cross-examination</CardTitle>
                <CardDescription>
                  Questions put by opposing counsel and the answers given.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CrossExamination
                  items={examinations}
                  participants={crossExaminationParticipants}
                  evidence={linkedEvidence}
                />
              </CardContent>
            </Card>
          ) : null}

          {/* Evidence & sources */}
          {linkedEvidence.length > 0 || sources.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Evidence &amp; sources</CardTitle>
                <CardDescription>
                  Authorities the arguments rely on. User-supplied citations
                  are unverified input, not checked authority.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DebateEvidencePanel
                  evidence={linkedEvidence}
                  sources={sources}
                />
              </CardContent>
            </Card>
          ) : null}

          {/* Scoring */}
          {scores.length > 0 ? (
            <DebateScoreboard
              rows={scores}
              momentum={momentum}
              criteria={debate.criteria}
              title="Debate score"
            />
          ) : null}
        </div>

        {/* ── Sidebar ──────────────────────────────────────── */}
        <aside className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <ParticipantListHeader
                description="Advocates and the bench for this debate."
                title="Participants"
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <ParticipantList
                activeId={selectedParticipantId ?? undefined}
                onSelect={(participant) =>
                  setSelectedParticipantId(participant.id)
                }
                participants={debate.participants}
              />
              {selectedParticipant ? (
                <>
                  <Separator />
                  <ParticipantProfile participant={selectedParticipant} />
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Round plan</CardTitle>
                <RoundProgress rounds={debate.rounds} />
              </div>
            </CardHeader>
            <CardContent>
              <DebateRounds
                activeId={activeRound?.id}
                rounds={debate.rounds}
              />
              {activeRound?.brief ? (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {activeRound.brief}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* ── Transcript ─────────────────────────────────────── */}
      <Card>
        <CardContent className="h-[min(70vh,900px)] min-h-[400px] pt-5">
          <DebateTranscript
            entries={debate.entries}
            evidence={evidence}
            rounds={debate.rounds}
            sources={sources}
          />
        </CardContent>
      </Card>

      {/* Progress bar for running debates */}
      {debate.status === "running" || debate.status === "waiting" ? (
        <div className="space-y-1.5">
          <Progress
            value={
              debate.rounds.length > 0
                ? Math.round((completedRounds / debate.rounds.length) * 100)
                : 0
            }
            className="h-1.5"
          />
          <span className="text-[10px] text-muted-foreground">
            {completedRounds}/{debate.rounds.length} rounds completed
          </span>
        </div>
      ) : null}
    </div>
  );
}
