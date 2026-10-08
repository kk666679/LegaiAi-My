"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { trpcReact } from "@/clients";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { Swords } from "lucide-react";
import { DebateNavigation } from "../_components/debate-navigation";

export default function DebateDetailPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const { data, isLoading, isError, error, refetch } = trpcReact.debate.getById.useQuery(jobId);

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="space-y-6 p-4 lg:p-6">
          <DebateNavigation />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardShell>
    );
  }

  if (isError || !data) {
    return (
      <DashboardShell>
        <div className="space-y-6 p-4 lg:p-6">
          <DebateNavigation />
          <div className="text-center py-12">
            <Swords className="size-12 mx-auto text-destructive" />
            <h2 className="mt-4 text-xl font-semibold">Debate not found</h2>
            <p className="mt-2 text-muted-foreground">The debate job you're looking for doesn't exist or you don't have access.</p>
            <Button asChild className="mt-4"><Link href="/lawmate/debate">Back to debates</Link></Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const rounds = Array.isArray(data.rounds) ? data.rounds : [];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <DebateNavigation />
        <PageHeader
          title="Debate Result"
          description={
            <>
              <Badge variant="secondary">{data.status}</Badge>
              {data.winner && <Badge variant="outline">Winner: {data.winner}</Badge>}
            </>
          }
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/lawmate/debate">Back to debates</Link>
            </Button>
          }
        />

        {rounds.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={Swords}
                title="No rounds yet"
                description="This debate has not started or has no recorded rounds."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rounds.map((round: any, idx: number) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-base">Round {round.round ?? idx + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Badge variant="secondary">{round.agent}</Badge>
                    {round.score !== undefined && <Badge variant="outline" className="ml-2">Score: {round.score}</Badge>}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{round.argument}</p>
                  {round.citations && round.citations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Citations</p>
                      <div className="flex flex-wrap gap-2">
                        {round.citations.map((c: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}