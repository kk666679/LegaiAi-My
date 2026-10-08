"use client";

import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { DebateSetup } from "@/components/debate/debate-setup";
import { trpcReact } from "@/clients";
import { DebateNavigation } from "../_components/debate-navigation";

export default function NewDebatePage() {
  const router = useRouter();
  const startDebate = trpcReact.debate.start.useMutation();

  const handleStart = async (input: {
    problem: string;
    citations: string[];
    rounds: number;
  }) => {
    const result = await startDebate.mutateAsync(input);
    router.push(`/lawmate/debate/${result.jobId}`);
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Start a debate"
          description="Submit a legal question for multi-agent adversarial analysis."
        />
        <DebateNavigation />
        <DebateSetup
          onStart={handleStart}
          submitting={startDebate.isPending}
          error={startDebate.error?.message}
        />
      </div>
    </DashboardShell>
  );
}
