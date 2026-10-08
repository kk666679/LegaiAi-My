"use client";
// app/lawmate/agents/_components/agent-tabs.tsx
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RunStatusBadge } from "./agent-status-badge";
import { AgentRunTimeline } from "./agent-run-timeline";
import { useAgents } from "./use-agents";

export function AgentRunsTab({ id }: { id: string }) {
  const { runs } = useAgents({ scope: "all" });
  const agentRuns = runs.filter((r) => r.agentId === id);
  if (agentRuns.length === 0) return <p className="p-6 text-sm text-muted-foreground">No runs recorded.</p>;
  return (
    <div className="mx-auto max-w-4xl space-y-3 p-4">
      {agentRuns.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">#{r.id}</span>
              <RunStatusBadge status={r.status} compact />
              <Badge variant="outline" className="text-[10px] capitalize">{r.trigger}</Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">{new Date(r.startedAt).toLocaleString()}</span>
          </div>
          {r.steps?.length ? <div className="mt-3"><AgentRunTimeline steps={r.steps} /></div> : null}
        </Card>
      ))}
    </div>
  );
}

export function AgentMetricsTab({ id }: { id: string }) {
  const { agents } = useAgents({ scope: "all" });
  const agent = agents.find((a) => a.id === id);
  if (!agent) return null;
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Success (7d)" value={agent.successRate7d != null ? `${(agent.successRate7d * 100).toFixed(1)}%` : "—"} />
        <MetricCard label="Avg duration" value={agent.avgDurationMs != null ? `${(agent.avgDurationMs / 1000).toFixed(1)}s` : "—"} />
        <MetricCard label="Max concurrency" value={String(agent.maxConcurrency ?? "—")} />
        <MetricCard label="Spend today" value={`$${(agent.spentTodayUsd ?? 0).toFixed(2)}`} />
      </div>
      <p className="text-xs text-muted-foreground">
        Historical charts will render here once the metrics endpoint is wired.
      </p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

export function AgentLogsTab({ id }: { id: string }) {
  const { audit } = useAgents({ scope: "all" });
  const events = audit.filter((a) => a.agentId === id);
  if (events.length === 0) return <p className="p-6 text-sm text-muted-foreground">No log entries.</p>;
  return (
    <div className="mx-auto max-w-4xl space-y-2 p-4">
      {events.map((e) => (
        <Card key={e.id} className="p-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</span>
            <Badge variant="outline" className="text-[10px] capitalize">{e.kind}</Badge>
          </div>
          <p className="mt-1">{e.message}</p>
        </Card>
      ))}
    </div>
  );
}

export function AgentSettingsTab({ id }: { id: string }) {
  const { agents } = useAgents({ scope: "all" });
  const agent = agents.find((a) => a.id === id);
  const [hardStop, setHardStop] = React.useState(true);
  if (!agent) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <Card className="space-y-4 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="agent-name">Name</Label>
          <Input id="agent-name" defaultValue={agent.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="agent-desc">Description</Label>
          <Textarea id="agent-desc" rows={3} defaultValue={agent.description} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="agent-conc">Max concurrency</Label>
            <Input id="agent-conc" type="number" defaultValue={agent.maxConcurrency} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agent-daily">Daily budget (USD)</Label>
            <Input id="agent-daily" type="number" step="0.01" defaultValue={agent.dailyBudgetUsd} />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <div>
            <p className="text-sm font-medium">Hard stop at budget</p>
            <p className="text-xs text-muted-foreground">Automatically pause agent when daily budget is exhausted.</p>
          </div>
          <Switch checked={hardStop} onCheckedChange={setHardStop} />
        </div>
        <div className="flex justify-end">
          <Button size="sm">Save changes</Button>
        </div>
      </Card>
    </div>
  );
}
