"use client";
// app/lawmate/agents/_components/agents-overview.tsx
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Agent, AgentFilters, AgentSort, AgentViewMode } from "./types";
import { useAgents } from "./use-agents";
import { AgentsStats } from "./agents-stats";
import { AgentsFilters } from "./agents-filters";
import { AgentList } from "./agent-list";

export interface AgentsOverviewProps {
  scope: "all" | "live" | "killed" | "errors" | string;
  title?: string;
  description?: string;
}

export function AgentsOverview({
  scope,
  title = "Agents",
  description = "Monitor, run, and govern AI agents across the workspace.",
}: AgentsOverviewProps) {
  const router = useRouter();
  const [view, setView] = React.useState<AgentViewMode>("grid");
  const [filters, setFilters] = React.useState<AgentFilters>({});
  const [sort, setSort] = React.useState<AgentSort>({ key: "tier", direction: "asc" });

  const { agents, stats, loading, error, run, pause, kill, revive } = useAgents({
    scope,
    filters,
    sort,
    pollMs: scope === "live" ? 5_000 : 0,
  });

  const handleOpen = (agent: Agent) => router.push(`/lawmate/agents/${agent.id}/overview`);
  const handleRun = async (agent: Agent) => {
    await run(agent.id);
    toast.success(`Started ${agent.name}`);
  };
  const handlePause = (agent: Agent) => {
    pause(agent.id);
    toast.message(`Paused ${agent.name}`);
  };
  const handleKill = (agent: Agent) => {
    kill(agent.id);
    toast.error(`Killed ${agent.name}`);
  };
  const handleRevive = (agent: Agent) => {
    revive(agent.id);
    toast.success(`Revived ${agent.name}`);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </header>

      <div className="space-y-4 p-4">
        {stats ? <AgentsStats stats={stats} /> : null}

        {error ? (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <AgentsFilters
          filters={filters}
          onFiltersChange={(n) => setFilters((f) => ({ ...f, ...n }))}
          onReset={() => setFilters({})}
        />

        <AgentList
          agents={agents}
          loading={loading}
          view={view}
          onViewChange={setView}
          sort={sort}
          onSortChange={(k) => setSort((s) => ({ ...s, key: k }))}
          onOpen={handleOpen}
          onRun={handleRun}
          onPause={handlePause}
          onKill={handleKill}
          onRevive={handleRevive}
        />
      </div>
    </div>
  );
}
