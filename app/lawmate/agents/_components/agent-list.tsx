"use client";
// app/lawmate/agents/_components/agent-list.tsx
import * as React from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Agent, AgentSort, AgentSortKey, AgentViewMode } from "./types";
import { AgentEmpty, AgentLoading } from "./agent-empty";

export interface AgentListProps {
  agents: Agent[];
  loading?: boolean;
  view?: AgentViewMode;
  onViewChange?: (v: AgentViewMode) => void;
  sort?: AgentSort;
  onSortChange?: (key: AgentSortKey) => void;
  onOpen?: (agent: Agent) => void;
  onRun?: (agent: Agent) => void;
  onPause?: (agent: Agent) => void;
  onKill?: (agent: Agent) => void;
  onRevive?: (agent: Agent) => void;
}

export function AgentList({
  agents,
  loading,
  view = "grid",
  onViewChange,
  sort,
  onSortChange,
  onOpen,
  onRun,
  onPause,
  onKill,
  onRevive,
}: AgentListProps) {
  if (loading) return <AgentLoading />;
  if (!agents.length) return <AgentEmpty />;

  return (
    <div className="space-y-3">
      {onViewChange ? (
        <div className="flex justify-end">
          <Tabs value={view} onValueChange={(v) => onViewChange(v as AgentViewMode)}>
            <TabsList>
              <TabsTrigger value="grid" aria-label="Grid"><LayoutGrid className="size-4" /></TabsTrigger>
              <TabsTrigger value="table" aria-label="Table"><Table2 className="size-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((a) => (
          <div key={a.id} className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{a.name}</p>
            </div>
            {a.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
            ) : null}
            <div className="mt-3 flex items-center gap-2">
              {onOpen ? (
                <button
                  type="button"
                  onClick={() => onOpen(a)}
                  className="rounded-md border border-border/60 px-2 py-1 text-xs hover:bg-accent"
                >
                  Open
                </button>
              ) : null}
              {onRun ? (
                <button
                  type="button"
                  onClick={() => onRun(a)}
                  className="rounded-md border border-border/60 px-2 py-1 text-xs hover:bg-accent"
                >
                  Run
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
