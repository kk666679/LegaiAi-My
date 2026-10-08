"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WorkflowRun, WorkflowNodeStatus } from "../types";
import { RunStatusBadge } from "../runs/run-status";
import { RunNodeResult } from "./run-node-result";
import { RunTimeline, type RunTimelineStep } from "./run-timeline";
import { RunLogs, type RunLogLine } from "./run-logs";

export interface RunNodeResultData { nodeId: string; nodeTitle: string; status: WorkflowNodeStatus; durationMs?: number; message?: string; input?: unknown; output?: unknown; }

export interface RunDetailProps {
  run: WorkflowRun;
  nodeResults: RunNodeResultData[];
  timeline?: RunTimelineStep[];
  logs?: RunLogLine[];
  onReplay?: () => void;
  onReplayFromNode?: (nodeId: string) => void;
}

export function RunDetail({ run, nodeResults, timeline = [], logs = [] }: RunDetailProps) {
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Run {run.id.slice(0, 8)}</p>
          <p className="text-sm font-medium">{new Date(run.startedAt).toLocaleString()}</p>
        </div>
        <RunStatusBadge status={run.status} />
        {run.durationMs ? <p className="text-sm tabular-nums text-muted-foreground">{run.durationMs < 1000 ? `${run.durationMs}ms` : `${(run.durationMs / 1000).toFixed(1)}s`}</p> : null}
      </Card>
      <Tabs defaultValue="nodes">
        <TabsList>
          <TabsTrigger value="nodes">Nodes ({nodeResults.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="nodes" className="mt-3 space-y-2">
          {nodeResults.map((r) => <RunNodeResult key={r.nodeId} {...r} />)}
        </TabsContent>
        <TabsContent value="timeline" className="mt-3">
          <Card className="p-4"><RunTimeline steps={timeline} /></Card>
        </TabsContent>
        <TabsContent value="logs" className="mt-3">
          <RunLogs lines={logs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
