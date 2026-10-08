"use client";
// app/legalai/agents/_components/agent-detail-page.tsx
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Pause, Play, RotateCcw, Skull } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAgents } from "./use-agents";
import { AgentStatusBadge, AgentTierBadge, RunStatusBadge } from "./agent-status-badge";
import { AgentRunTimeline } from "./agent-run-timeline";

export function AgentDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { agents, runs, audit, run, pause, kill, revive, cancelRun } = useAgents({ scope: "all" });
  const agent = agents.find((a) => a.id === id);
  const agentRuns = runs.filter((r) => r.agentId === id);
  const agentAudit = audit.filter((a) => a.agentId === id);

  if (!agent) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading agent…</p>
      </div>
    );
  }

  const budgetPct = agent.dailyBudgetUsd
    ? Math.min(100, ((agent.spentTodayUsd ?? 0) / agent.dailyBudgetUsd) * 100)
    : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          aria-label="Back to agents"
          onClick={() => router.push("/legalai/agents")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold">{agent.name}</h1>
            <AgentTierBadge tier={agent.tier} />
            <AgentStatusBadge status={agent.status} compact />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            <span className="font-mono">{agent.id}</span>
            {agent.model ? <> · {agent.model}</> : null}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {agent.killed ? (
            <Button size="sm" className="gap-1.5" onClick={() => { revive(agent.id); toast.success("Agent revived"); }}>
              <RotateCcw className="size-3.5" /> Revive
            </Button>
          ) : agent.status === "running" || agent.status === "thinking" ? (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { pause(agent.id); toast.message("Paused"); }}>
              <Pause className="size-3.5" /> Pause
            </Button>
          ) : (
            <Button size="sm" className="gap-1.5" onClick={async () => { await run(agent.id); toast.success("Started"); }}>
              <Play className="size-3.5" /> Run
            </Button>
          )}
          {!agent.killed ? (
            <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => { kill(agent.id); toast.error("Killed"); }}>
              <Skull className="size-3.5" /> Kill
            </Button>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-5xl space-y-4">
          {agent.description ? (
            <Card className="p-4">
              <p className="text-sm leading-relaxed">{agent.description}</p>
            </Card>
          ) : null}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Success (7d)" value={agent.successRate7d != null ? `${(agent.successRate7d * 100).toFixed(1)}%` : "—"} />
            <Stat label="Avg duration" value={agent.avgDurationMs != null ? agent.avgDurationMs < 1000 ? `${agent.avgDurationMs}ms` : `${(agent.avgDurationMs / 1000).toFixed(1)}s` : "—"} />
            <Stat label="Max concurrency" value={agent.maxConcurrency != null ? String(agent.maxConcurrency) : "—"} />
            <Stat label="Token budget / run" value={agent.tokenBudgetPerRun != null ? agent.tokenBudgetPerRun.toLocaleString() : "—"} />
          </div>

          {agent.dailyBudgetUsd ? (
            <Card className="space-y-2 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Today's budget</span>
                <span className="tabular-nums text-muted-foreground">
                  ${(agent.spentTodayUsd ?? 0).toFixed(2)} / ${agent.dailyBudgetUsd.toFixed(2)}
                </span>
              </div>
              <Progress value={budgetPct} className={budgetPct >= 90 ? "[&>div]:bg-destructive" : undefined} />
              <p className="text-[11px] text-muted-foreground">
                {budgetPct >= 90
                  ? "Approaching limit — agent will pause automatically at 100%."
                  : `${Math.round(100 - budgetPct)}% remaining today`}
              </p>
            </Card>
          ) : null}

          <Card className="p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Capabilities</p>
            <div className="flex flex-wrap gap-1.5">
              {agent.capabilities.map((c) => (
                <Badge key={c} variant="secondary" className="text-[10px] font-mono">
                  {c}
                </Badge>
              ))}
            </div>
          </Card>

          <Tabs defaultValue="runs" className="space-y-3">
            <TabsList>
              <TabsTrigger value="runs">Runs ({agentRuns.length})</TabsTrigger>
              <TabsTrigger value="audit">Audit ({agentAudit.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="runs" className="space-y-3">
              {agentRuns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No runs recorded yet.</p>
              ) : (
                agentRuns.map((r) => (
                  <Card key={r.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">#{r.id}</span>
                        <RunStatusBadge status={r.status} compact />
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {r.trigger}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {r.costUsd != null ? <span className="tabular-nums">${r.costUsd.toFixed(3)}</span> : null}
                        {r.durationMs != null ? <span className="tabular-nums">{r.durationMs < 1000 ? `${r.durationMs}ms` : `${(r.durationMs / 1000).toFixed(1)}s`}</span> : null}
                        <span>{new Date(r.startedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    {r.error ? (
                      <p className="mt-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
                        {r.error}
                      </p>
                    ) : null}
                    {r.steps?.length ? (
                      <div className="mt-3">
                        <AgentRunTimeline steps={r.steps} />
                      </div>
                    ) : null}
                    {r.status === "running" ? (
                      <div className="mt-3">
                        <Button size="sm" variant="outline" onClick={() => cancelRun(r.id)}>
                          Cancel run
                        </Button>
                      </div>
                    ) : null}
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="audit" className="space-y-2">
              {agentAudit.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audit events recorded.</p>
              ) : (
                agentAudit.map((e) => (
                  <Card key={e.id} className="flex items-start gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">{e.kind}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(e.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {e.message ? <p className="mt-1 text-sm">{e.message}</p> : null}
                      {e.actorName ? <p className="mt-0.5 text-[11px] text-muted-foreground">by {e.actorName}</p> : null}
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </Card>
  );
}
