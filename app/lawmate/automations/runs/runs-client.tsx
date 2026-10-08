// app/lawmate/automations/runs/runs-client.tsx
"use client";
import * as React from "react";
import { RunList } from "@/components/automation";
import type { WorkflowRun } from "@/components/automation";
import { trpcReact } from "@/clients";
import { AutomationEmpty } from "@/components/automation/status/automation-empty";
import { AutomationLoading } from "@/components/automation/status/automation-loading";
import { AutomationError } from "@/components/automation/status/automation-error";

export function AllRunsPage() {
  const [runs, setRuns] = React.useState<WorkflowRun[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadRuns = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await trpcReact.automations.runs.list.query({});
        const converted = data.items.map((r: any) => ({
          id: r.id,
          workflowId: r.workflowId,
          status: r.status as WorkflowRun["status"],
          trigger: r.trigger,
          jobId: r.jobId,
          input: r.input,
          output: r.output,
          errorMessage: r.errorMessage,
          startedAt: r.startedAt,
          finishedAt: r.finishedAt,
          durationMs: r.durationMs,
          nodeResults: r.nodeResults,
          createdAt: r.createdAt,
        }));
        setRuns(converted);
      } catch (err) {
        setError(`Failed to load runs: ${(err as Error)?.message ?? "Unknown error"}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadRuns();
  }, []);

  if (isLoading) {
    return <AutomationLoading />;
  }

  if (error) {
    return <AutomationError title="Couldn't load runs" description={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">All runs</h1>
        <p className="text-xs text-muted-foreground">Every workflow execution across your workspace.</p>
      </header>
      <div className="p-4">
        {runs.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">
            No runs yet. Trigger a workflow to see results here.
          </p>
        ) : (
          <RunList runs={runs} />
        )}
      </div>
    </div>
  );
}