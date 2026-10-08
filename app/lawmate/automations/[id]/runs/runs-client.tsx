"use client";
import * as React from "react";
import { RunList } from "@/components/automation";
import type { WorkflowRun } from "@/components/automation";

export function WorkflowRunsPage({ id }: { id: string }) {
  const [runs, setRuns] = React.useState<WorkflowRun[]>([]);
  React.useEffect(() => {
    // GET /api/automations/:id/runs
  }, [id]);
  return (
    <div className="p-4">
      <h2 className="mb-3 text-sm font-medium">Run history</h2>
      <RunList runs={runs} />
    </div>
  );
}
