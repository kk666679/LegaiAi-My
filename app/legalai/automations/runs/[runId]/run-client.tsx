"use client";
import * as React from "react";
import { RunDetail, type WorkflowRun, type RunNodeResultData } from "@/components/automation";

export function RunDetailPage({ runId }: { runId: string }) {
  const [run, setRun] = React.useState<WorkflowRun | null>(null);
  const [nodeResults, setNodeResults] = React.useState<RunNodeResultData[]>([]);

  React.useEffect(() => {
    // GET /api/automations/runs/:runId
    // GET /api/automations/runs/:runId/nodes
  }, [runId]);

  if (!run) return <p className="p-6 text-sm text-muted-foreground">Loading run…</p>;
  return (
    <div className="p-4">
      <RunDetail run={run} nodeResults={nodeResults} />
    </div>
  );
}
