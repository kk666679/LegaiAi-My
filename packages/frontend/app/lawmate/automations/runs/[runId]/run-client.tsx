// app/lawmate/automations/runs/[runId]/run-client.tsx
"use client";
import * as React from "react";
import { RunDetail, type WorkflowRun, type RunNodeResultData } from "@/components/automation";
import { trpcReact } from "@/clients";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export function RunDetailPage({ runId }: { runId: string }) {
  const [run, setRun] = React.useState<WorkflowRun | null>(null);
  const [nodeResults, setNodeResults] = React.useState<RunNodeResultData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadRun = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await trpcReact.automations.runs.get.query({ id: runId });
        const convertedRun: WorkflowRun = {
          id: data.id,
          workflowId: data.workflowId,
          status: data.status as WorkflowRun["status"],
          trigger: data.trigger,
          jobId: data.jobId,
          input: data.input,
          output: data.output,
          errorMessage: data.errorMessage,
          startedAt: data.startedAt,
          finishedAt: data.finishedAt,
          durationMs: data.durationMs,
          nodeResults: data.nodeResults,
          createdAt: data.createdAt,
        };
        setRun(convertedRun);
        setNodeResults(data.nodeResults ?? []);
      } catch (err) {
        setError(`Failed to load run: ${(err as Error)?.message ?? "Unknown error"}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadRun();
  }, [runId]);

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading run…</p>;
  }

  if (error) {
    return <p className="p-6 text-xs text-destructive">{error}</p>;
  }

  if (!run) {
    return <p className="p-6 text-xs text-muted-foreground">Run not found</p>;
  }

  return (
    <div className="p-4">
      <RunDetail run={run} nodeResults={nodeResults} />
    </div>
  );
}