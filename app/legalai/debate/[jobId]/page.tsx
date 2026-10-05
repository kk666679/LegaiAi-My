"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LegalDisclaimer } from "@/components/lawmate/LegalDisclaimer";
import { DebateStatusBadge } from "@/components/debate/core/debate-status";
import { DebateWorkspace } from "@/components/debate/workspace/debate-workspace";
import { useDebateJob } from "@/hooks/useDebateJob";
import { AlertTriangle, ArrowLeft, RefreshCw, Swords } from "lucide-react";

export default function DebateResultPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const { query, jobState, presentation, status, debate } =
    useDebateJob(jobId);

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
          {query.data ? <DebateStatusBadge status={status} /> : null}
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
        ) : presentation === "failed" ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Debate processing failed</AlertTitle>
            <AlertDescription>
              The worker did not complete this debate. You can start a new job
              and try again.
            </AlertDescription>
          </Alert>
        ) : debate ? (
          <>
            {presentation !== "completed" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Debate in progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    The debate worker is processing this job. The round plan and
                    participants appear below; submissions stream in as the
                    debate advances. This page checks for updates automatically.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Job state: {jobState ?? "checking"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <Swords className="size-4" aria-hidden />
                <AlertTitle>Generated content is unverified</AlertTitle>
                <AlertDescription>
                  The worker does not verify its generated arguments or
                  authorities against primary sources. Check every proposition
                  and citation independently. This AI assessment is not a
                  judicial decision.
                </AlertDescription>
              </Alert>
            )}

            <DebateWorkspace debate={debate} />
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Debate queued</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The debate worker has not completed this job yet. This page
                checks for updates automatically.
              </p>
              <p className="text-xs text-muted-foreground">
                Job state: {jobState ?? "checking"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
