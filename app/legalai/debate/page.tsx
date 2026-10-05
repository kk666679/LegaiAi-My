"use client";

import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { LegalDisclaimer } from "@/components/lawmate/LegalDisclaimer";
import { usePermission } from "@/components/shared/PermissionGate";
import { trpcReact } from "@/clients";
import { DebateSetup, type DebateStartInput } from "@/components/debate/debate-setup";
import { Swords, ShieldAlert } from "lucide-react";

export default function DebatePage() {
  const router = useRouter();
  const canRunDebate = usePermission("run_agents");
  const startDebate = trpcReact.agents.debate.useMutation();

  const handleStart = async (input: DebateStartInput) => {
    const result = await startDebate.mutateAsync(input);
    if (!result?.jobId) {
      throw new Error("The server did not return a debate job identifier.");
    }
    router.push(`/legalai/debate/${encodeURIComponent(result.jobId)}`);
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <Swords className="size-6 text-primary" aria-hidden />
            <h1 className="text-2xl font-semibold tracking-tight">Legal debate</h1>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Explore opposing arguments for a legal issue. Debate output is an
            AI-generated aid for lawyer review, not a judicial decision.
          </p>
        </header>

        <LegalDisclaimer />

        {!canRunDebate ? (
          <Alert variant="destructive">
            <ShieldAlert />
            <AlertTitle>Debate access unavailable</AlertTitle>
            <AlertDescription>
              Your account does not have permission to run agent workflows.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert>
              <ShieldAlert />
              <AlertTitle>Protect client information</AlertTitle>
              <AlertDescription>
                Do not submit confidential or privileged information. Debate
                responses and citations are not independently verified. Only
                enter authorities you are permitted to share with the configured
                AI service.
              </AlertDescription>
            </Alert>

            <DebateSetup
              onStart={handleStart}
              submitting={startDebate.isPending}
              error={startDebate.error?.message}
            />

            <Card>
              <CardContent className="grid gap-4 pt-5 sm:grid-cols-3">
                {[
                  ["Opposing submissions", "Two adversarial arguments per selected round."],
                  ["User-supplied authorities", "References are considered as input, not verified."],
                  ["AI assessment", "An evaluative summary is not a court judgment."],
                ].map(([title, description]) => (
                  <div key={title} className="space-y-1">
                    <h2 className="text-sm font-medium">{title}</h2>
                    <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
