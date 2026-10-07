"use client";
// app/legalai/agents/_components/all-runs-page.tsx
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgents } from "./use-agents";
import { RunStatusBadge } from "./agent-status-badge";
import type { RunStatus } from "./types";

export function AllRunsPage() {
  const { runs, loading } = useAgents({ scope: "all" });
  const [filter, setFilter] = React.useState<RunStatus | "all">("all");
  const filtered = filter === "all" ? runs : runs.filter((r) => r.status === filter);
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">Run history</h1>
        <p className="text-xs text-muted-foreground">Every agent run across the workspace.</p>
      </header>
      <div className="p-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as RunStatus | "all")} className="mb-3">
          <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
            {(["all", "running", "succeeded", "failed", "queued"] as const).map((s) => (
              <TabsTrigger key={s} value={s} className="rounded-full border border-border/60 capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="space-y-2">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
           filtered.length === 0 ? <p className="text-sm text-muted-foreground">No runs.</p> :
           filtered.map((r) => (
            <Card key={r.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.agentName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  <span className="font-mono">#{r.id}</span> · {new Date(r.startedAt).toLocaleString()}
                </p>
              </div>
              <RunStatusBadge status={r.status} compact />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
