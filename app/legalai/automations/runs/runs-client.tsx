"use client";
import * as React from "react";
import { RunList } from "@/components/automation";
import type { WorkflowRun } from "@/components/automation";

export function AllRunsPage() {
  const [runs, setRuns] = React.useState<WorkflowRun[]>([]);
  React.useEffect(() => { /* GET /api/automations/runs */ }, []);
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">All runs</h1>
        <p className="text-xs text-muted-foreground">Every workflow execution across your workspace.</p>
      </header>
      <div className="p-4"><RunList runs={runs} /></div>
    </div>
  );
}
