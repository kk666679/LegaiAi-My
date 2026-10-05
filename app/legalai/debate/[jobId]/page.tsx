"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { Query } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { LegalDisclaimer } from "@/components/lawmate/LegalDisclaimer";
import { DebateRounds } from "@/components/debate/rounds/round-list";
import { DebateTranscript } from "@/components/debate/transcript/transcript";
import { DebateStatusBadge } from "@/components/debate/core/debate-status";
import { trpcReact } from "@/clients";
import type { DebateEntry, DebateRound } from "@/types/debate";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

interface DebateTranscriptItem {
  round: number;
  role: "applicant" | "respondent" | "judge";
  argument: string;
  timestamp: string;
}

interface DebateResult {
  debateId: string;
  problem: string;
  rounds: number;
  transcript: DebateTranscriptItem[];
  judgment: string;
}

interface DebateJobStatus {
  state: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseDebateResult(value: unknown): DebateResult | null {
  if (!isRecord(value) || typeof value.debateId !== "string" ||
      typeof value.problem !== "string" || typeof value.judgment !== "string" ||
      !Array.isArray(value.transcript) || !Number.isInteger(value.rounds)) {
    return null;
  }

  const transcript: DebateTranscriptItem[] = [];
  for (const entry of value.transcript) {
    if (!isRecord(entry) || !Number.isInteger(entry.round) ||
        (entry.role !== "applicant" && entry.role !== "respondent" && entry.role !== "judge") ||
        typeof entry.argument !== "string" || typeof entry.timestamp !== "string") {
      return null;
    }
    transcript.push({
      round: entry.round as number,
      role: entry.role,
      argument: entry.argument,
      timestamp: entry.timestamp,
    });
  }

  return {
    debateId: value.debateId,
    problem: value.problem,
    rounds: value.rounds as number,
    transcript,
    judgment: value.judgment,
  };
}

function toDebateView(result: DebateResult): { entries: DebateEntry[]; rounds: DebateRound[] } {
  const entries = result.transcript.map((entry, index): DebateEntry => ({
    id: `${result.debateId}-${index}`,
    roundId: String(entry.round),
    participantId:
      entry.role === "applicant"
        ? "Applicant's counsel"
        : entry.role === "respondent"
          ? "Respondent's counsel"
          : "AI evaluator",
    role: entry.role === "judge" ? "judge" : "ai",
    side: entry.role === "applicant" ? "proponent" : entry.role === "respondent" ? "opponent" : "neutral",
    kind: entry.role === "judge" ? "judgment" : "argument",
    content: entry.argument,
    timestamp: entry.timestamp,
    generatedByAi: true,
  }));

  const rounds: DebateRound[] = Array.from(
    { length: result.rounds + 1 },
    (_, index) => {
      const judgment = index === result.rounds;
      return {
        id: String(index + 1),
        index: index + 1,
        type: judgment ? "judgment" : "argument",
        title: judgment ? "AI assessment" : `Argument round ${index + 1}`,
        status: "completed",
      };
    },
  );

  return { entries, rounds };
}

export default function DebateResultPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const query = trpcReact.agents.debateStatus.useQuery(
    { jobId },
    {
      enabled: Boolean(jobId),
      refetchInterval: (currentQuery: Query<DebateJobStatus>) =>
        currentQuery.state.data?.state === "completed" ||
        currentQuery.state.data?.state === "failed"
          ? false
          : 2000,
    },
  );

  const result = query.data?.state === "completed"
    ? parseDebateResult(query.data.result)
    : null;
  const debateView = result ? toDebateView(result) : null;
  const jobState = query.data?.state;
  const presentation = jobState === "active"
    ? { status: "running" as const, label: "Running" }
    : jobState === "completed"
      ? { status: "completed" as const, label: "Complete" }
      : jobState === "failed"
        ? { status: "error" as const, label: "Failed" }
        : { status: "ready" as const, label: "Queued" };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-2">
          <Link href="/legalai/debate">
            <ArrowLeft className="size-4" aria-hidden />
            New debate
          </Link>
        </Button>

        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Debate job
            </p>
            <h1 className="mt-1 break-all text-xl font-semibold">{jobId}</h1>
          </div>
          {query.data ? <DebateStatusBadge status={presentation.status} label={presentation.label} /> : null}
        </header>

        <LegalDisclaimer />

        {query.isLoading ? (
          <Card>
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ) : query.error ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Could not load debate</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>{query.error.message}</span>
              <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                <RefreshCw className="mr-2 size-3.5" aria-hidden />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : jobState === "failed" ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Debate processing failed</AlertTitle>
            <AlertDescription>
              The worker did not complete this debate. You can start a new job and try again.
            </AlertDescription>
          </Alert>
        ) : jobState === "completed" && !result ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Debate result unavailable</AlertTitle>
            <AlertDescription>
              The completed job returned a result in an unexpected format. No partial result is shown.
            </AlertDescription>
          </Alert>
        ) : result && debateView ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Question submitted</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.problem}</p>
              </CardContent>
            </Card>

            <Alert>
              <AlertTriangle />
              <AlertTitle>Generated content is unverified</AlertTitle>
              <AlertDescription>
                The worker does not verify its generated arguments or authorities against
                primary sources. Check every proposition and citation independently.
                This AI assessment is not a judicial decision.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Round plan</CardTitle>
              </CardHeader>
              <CardContent>
                <DebateRounds rounds={debateView.rounds} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="h-[min(70vh,900px)] min-h-[400px] pt-5">
                <DebateTranscript entries={debateView.entries} rounds={debateView.rounds} />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Debate queued</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The debate worker has not completed this job yet. This page checks for
                updates automatically.
              </p>
              <p className="text-xs text-muted-foreground">
                Job state: {typeof jobState === "string" ? jobState : "checking"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
