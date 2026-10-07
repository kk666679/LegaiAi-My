"use client";
// app/legalai/agents/_components/use-agents.ts
import * as React from "react";
import type {
  Agent,
  AgentBudget,
  AgentFilters,
  AgentRun,
  AgentSkill,
  AgentSort,
  AgentStats,
  AgentAuditEvent,
  RunStatus,
  AgentStatus,
} from "./types";

export interface UseAgentsOptions {
  filters?: AgentFilters;
  sort?: AgentSort;
  /** "all" | "live" | tier name — used by scoped pages */
  scope?: string;
  /** Poll interval for live updates, ms. 0 disables. */
  pollMs?: number;
  /** Optional endpoint override */
  endpoint?: string;
}

export interface UseAgentsResult {
  agents: Agent[];
  stats: AgentStats | null;
  runs: AgentRun[];
  audit: AgentAuditEvent[];
  skills: AgentSkill[];
  loading: boolean;
  error?: string;

  // Actions
  run: (agentId: string) => Promise<void>;
  pause: (agentId: string) => void;
  resume: (agentId: string) => void;
  kill: (agentId: string) => void;
  revive: (agentId: string) => void;
  cancelRun: (runId: string) => void;
  reload: () => void;
}

export function useAgents(options: UseAgentsOptions = {}): UseAgentsResult {
  const { filters, sort, scope = "all", pollMs = 0 } = options;

  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [stats, setStats] = React.useState<AgentStats | null>(null);
  const [runs, setRuns] = React.useState<AgentRun[]>([]);
  const [audit, setAudit] = React.useState<AgentAuditEvent[]>([]);
  const [skills, setSkills] = React.useState<AgentSkill[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const [tick, setTick] = React.useState(0);

  const reload = React.useCallback(() => setTick((t) => t + 1), []);

  // ── Data fetch ──────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);

    // Real integration:
    //   const params = new URLSearchParams({ scope });
    //   if (filters?.query) params.set("q", filters.query);
    //   const res = await fetch(`/api/agents?${params}`, { signal });
    //
    // Mock data lives below so the UI is fully testable today.

    const mock = createMockData();
    const filterAndSort = () => {
      let list = mock.agents;

      if (scope === "live") list = list.filter((a) => a.status === "running" || a.status === "thinking");
      if (scope === "killed") list = list.filter((a) => a.killed);
      if (scope === "errors") list = list.filter((a) => a.status === "error");
      if (scope.startsWith("tier:")) {
        const tier = scope.slice(5);
        list = list.filter((a) => a.tier === tier);
      }

      if (filters?.query) {
        const q = filters.query.toLowerCase();
        list = list.filter((a) => `${a.name} ${a.description ?? ""}`.toLowerCase().includes(q));
      }
      if (filters?.tier?.length) list = list.filter((a) => filters.tier!.includes(a.tier));
      if (filters?.status?.length) list = list.filter((a) => filters.status!.includes(a.status));
      if (filters?.kind?.length) list = list.filter((a) => filters.kind!.includes(a.kind));
      if (filters?.capabilities?.length)
        list = list.filter((a) => filters.capabilities!.some((c) => a.capabilities.includes(c)));

      if (sort) {
        list = [...list].sort((a, b) => {
          const dir = sort.direction === "asc" ? 1 : -1;
          switch (sort.key) {
            case "name": return a.name.localeCompare(b.name) * dir;
            case "tier": {
              const order = { orchestrator: 0, tier1: 1, tier2: 2, tier3: 3 };
              return ((order[a.tier] ?? 9) - (order[b.tier] ?? 9)) * dir;
            }
            case "status": return a.status.localeCompare(b.status) * dir;
            case "lastRunAt":
              return ((a.lastRunAt ? new Date(a.lastRunAt).getTime() : 0) -
                (b.lastRunAt ? new Date(b.lastRunAt).getTime() : 0)) * dir;
            case "successRate7d": return ((a.successRate7d ?? 0) - (b.successRate7d ?? 0)) * dir;
            case "spend": return ((a.spentTodayUsd ?? 0) - (b.spentTodayUsd ?? 0)) * dir;
            default: return 0;
          }
        });
      }
      return list;
    };

    Promise.resolve(mock)
      .then((m) => {
        if (cancelled) return;
        setAgents(filterAndSort());
        setStats(m.stats);
        setRuns(m.runs);
        setAudit(m.audit);
        setSkills(m.skills);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, sort, scope, tick]);

  // ── Polling for live updates ────────────────────────────
  React.useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(reload, pollMs);
    return () => clearInterval(id);
  }, [pollMs, reload]);

  // ── Actions ─────────────────────────────────────────────
  const patchAgent = React.useCallback((id: string, patch: Partial<Agent>) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const run = React.useCallback(
    async (agentId: string) => {
      const agent = agents.find((a) => a.id === agentId);
      if (!agent) return;
      if (agent.killed) {
        // In a real app this fires a toast; keeping the hook pure here
        return;
      }
      // POST /api/agents/:id/run
      patchAgent(agentId, { status: "running", lastRunAt: new Date().toISOString() });
    },
    [agents, patchAgent],
  );

  const pause = React.useCallback((id: string) => patchAgent(id, { status: "paused" }), [patchAgent]);
  const resume = React.useCallback((id: string) => patchAgent(id, { status: "idle" }), [patchAgent]);

  const kill = React.useCallback(
    (id: string) => {
      patchAgent(id, { status: "disabled", killed: true });
      setAudit((prev) => [
        {
          id: `a-${Date.now()}`,
          agentId: id,
          agentName: agents.find((a) => a.id === id)?.name ?? id,
          kind: "killed",
          timestamp: new Date().toISOString(),
          message: "Kill switch engaged",
        },
        ...prev,
      ]);
    },
    [agents, patchAgent],
  );

  const revive = React.useCallback(
    (id: string) => {
      patchAgent(id, { status: "idle", killed: false });
      setAudit((prev) => [
        {
          id: `a-${Date.now()}`,
          agentId: id,
          agentName: agents.find((a) => a.id === id)?.name ?? id,
          kind: "revived",
          timestamp: new Date().toISOString(),
          message: "Agent revived",
        },
        ...prev,
      ]);
    },
    [agents, patchAgent],
  );

  const cancelRun = React.useCallback((runId: string) => {
    setRuns((prev) =>
      prev.map((r) =>
        r.id === runId ? { ...r, status: "cancelled" as RunStatus, finishedAt: new Date().toISOString() } : r,
      ),
    );
  }, []);

  return {
    agents,
    stats,
    runs,
    audit,
    skills,
    loading,
    error,
    run,
    pause,
    resume,
    kill,
    revive,
    cancelRun,
    reload,
  };
}

// ─────────────────────────────────────────────────────────────
// Mock dataset — replace with a real API when the backend is ready
// ─────────────────────────────────────────────────────────────
function createMockData(): {
  agents: Agent[];
  stats: AgentStats;
  runs: AgentRun[];
  audit: AgentAuditEvent[];
  skills: AgentSkill[];
} {
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

  const agents: Agent[] = [
    {
      id: "orchestrator",
      name: "Orchestrator",
      kind: "orchestrator",
      tier: "orchestrator",
      status: "idle",
      description: "Decomposes requests and routes to tier-1 agents.",
      model: "claude-opus-4-5",
      capabilities: ["workflow.execute", "ai.generate"],
      successRate7d: 0.982,
      avgDurationMs: 4200,
      lastRunAt: iso(60_000),
      registeredAt: iso(90 * 86_400_000),
      maxConcurrency: 8,
      tokenBudgetPerRun: 40_000,
      dailyBudgetUsd: 30,
      spentTodayUsd: 18.42,
    },
    {
      id: "retrieval",
      name: "Retrieval Agent",
      kind: "content",
      tier: "tier1",
      status: "running",
      description: "Hybrid semantic + keyword retrieval over legal corpus.",
      model: "claude-sonnet-4-5",
      capabilities: ["documents.read", "legal.research", "web.search"],
      successRate7d: 0.964,
      avgDurationMs: 2800,
      lastRunAt: iso(4_000),
      registeredAt: iso(88 * 86_400_000),
      maxConcurrency: 16,
      tokenBudgetPerRun: 20_000,
      dailyBudgetUsd: 20,
      spentTodayUsd: 11.09,
    },
    {
      id: "irac-engine",
      name: "IRAC Engine",
      kind: "content",
      tier: "tier1",
      status: "thinking",
      description: "Issue–Rule–Application–Conclusion reasoning over facts.",
      model: "claude-opus-4-5",
      capabilities: ["ai.analyse", "legal.research"],
      successRate7d: 0.921,
      avgDurationMs: 8100,
      lastRunAt: iso(2_000),
      registeredAt: iso(75 * 86_400_000),
      maxConcurrency: 4,
      tokenBudgetPerRun: 60_000,
      dailyBudgetUsd: 40,
      spentTodayUsd: 27.15,
    },
    {
      id: "drafting",
      name: "Drafting Agent",
      kind: "content",
      tier: "tier1",
      status: "idle",
      description: "Drafts contracts, letters, and memoranda.",
      model: "claude-sonnet-4-5",
      capabilities: ["documents.write", "ai.generate"],
      successRate7d: 0.948,
      avgDurationMs: 12_400,
      lastRunAt: iso(3 * 3_600_000),
      registeredAt: iso(70 * 86_400_000),
      maxConcurrency: 6,
      tokenBudgetPerRun: 50_000,
      dailyBudgetUsd: 25,
      spentTodayUsd: 8.93,
    },
    {
      id: "critic",
      name: "Critic",
      kind: "critic",
      tier: "tier3",
      status: "idle",
      description: "Adversarial review of drafts and analysis.",
      model: "claude-opus-4-5",
      capabilities: ["ai.analyse"],
      successRate7d: 0.891,
      avgDurationMs: 6_400,
      lastRunAt: iso(1 * 3_600_000),
      registeredAt: iso(60 * 86_400_000),
      maxConcurrency: 4,
      tokenBudgetPerRun: 35_000,
      dailyBudgetUsd: 15,
      spentTodayUsd: 4.12,
    },
    {
      id: "evaluator",
      name: "Evaluator",
      kind: "evaluator",
      tier: "tier3",
      status: "idle",
      description: "Scores outputs against golden datasets.",
      model: "claude-sonnet-4-5",
      capabilities: ["ai.analyse"],
      successRate7d: 0.996,
      avgDurationMs: 1_900,
      lastRunAt: iso(6 * 3_600_000),
      registeredAt: iso(58 * 86_400_000),
      maxConcurrency: 8,
      tokenBudgetPerRun: 15_000,
      dailyBudgetUsd: 8,
      spentTodayUsd: 2.04,
    },
    {
      id: "citation-validator",
      name: "Citation Validator",
      kind: "validation-worker",
      tier: "tier2",
      status: "running",
      description: "Validates every citation against source material.",
      capabilities: ["legal.research", "ai.analyse"],
      successRate7d: 0.999,
      avgDurationMs: 800,
      lastRunAt: iso(500),
      registeredAt: iso(55 * 86_400_000),
      maxConcurrency: 32,
      tokenBudgetPerRun: 5_000,
      dailyBudgetUsd: 5,
      spentTodayUsd: 0.88,
    },
    {
      id: "compliance-worker",
      name: "Compliance Worker",
      kind: "compliance-worker",
      tier: "tier2",
      status: "idle",
      description: "Checks outputs against PDPA, AMLA, and firm policy.",
      capabilities: ["ai.analyse", "hitl.enqueue"],
      successRate7d: 0.972,
      avgDurationMs: 2_300,
      lastRunAt: iso(2 * 3_600_000),
      registeredAt: iso(50 * 86_400_000),
      maxConcurrency: 12,
      tokenBudgetPerRun: 12_000,
      dailyBudgetUsd: 6,
      spentTodayUsd: 1.71,
    },
    {
      id: "notification-worker",
      name: "Notification Worker",
      kind: "notification-worker",
      tier: "tier2",
      status: "idle",
      description: "Sends email, Slack, and in-app notifications.",
      capabilities: ["notify.email", "notify.slack"],
      successRate7d: 0.999,
      avgDurationMs: 320,
      lastRunAt: iso(20 * 60_000),
      registeredAt: iso(48 * 86_400_000),
      maxConcurrency: 64,
      dailyBudgetUsd: 1,
      spentTodayUsd: 0.02,
    },
    {
      id: "report-worker",
      name: "Report Worker",
      kind: "report-worker",
      tier: "tier2",
      status: "error",
      description: "Compiles matter reports and analytics.",
      capabilities: ["documents.write", "matters.read"],
      successRate7d: 0.812,
      avgDurationMs: 4_200,
      lastRunAt: iso(45 * 60_000),
      registeredAt: iso(45 * 86_400_000),
      maxConcurrency: 4,
      dailyBudgetUsd: 3,
      spentTodayUsd: 0.91,
    },
    {
      id: "curator",
      name: "Curator",
      kind: "curator",
      tier: "tier3",
      status: "idle",
      description: "Maintains the clause library and playbook.",
      capabilities: ["documents.write", "ai.analyse"],
      successRate7d: 0.941,
      avgDurationMs: 5_600,
      lastRunAt: iso(12 * 3_600_000),
      registeredAt: iso(42 * 86_400_000),
      maxConcurrency: 2,
      dailyBudgetUsd: 4,
      spentTodayUsd: 0.44,
    },
  ];

  const runs: AgentRun[] = [
    {
      id: "run-001",
      agentId: "irac-engine",
      agentName: "IRAC Engine",
      status: "running",
      startedAt: iso(2_000),
      trigger: "event",
      triggeredBy: "matter-246",
      tokensIn: 8_420,
      tokensOut: 3_180,
      costUsd: 0.42,
      toolsCalled: 4,
      steps: [
        { id: "s1", kind: "plan", label: "Decomposed issue", status: "complete", startedAt: iso(1_900), finishedAt: iso(1_800) },
        { id: "s2", kind: "tool", label: "Search Malaysian statutes", status: "complete", startedAt: iso(1_800), toolName: "legal.search", toolInput: { query: "Employment Act misconduct" }, toolOutput: "12 statutes found" },
        { id: "s3", kind: "reason", label: "Applied rules to facts", status: "active", startedAt: iso(1_500), confidence: 0.82 },
        { id: "s4", kind: "decision", label: "Form conclusion", status: "pending", startedAt: iso(500) },
      ],
    },
    {
      id: "run-002",
      agentId: "retrieval",
      agentName: "Retrieval Agent",
      status: "succeeded",
      startedAt: iso(120_000),
      finishedAt: iso(117_400),
      durationMs: 2_600,
      trigger: "queue",
      tokensIn: 1_200,
      tokensOut: 400,
      costUsd: 0.08,
      toolsCalled: 3,
    },
    {
      id: "run-003",
      agentId: "citation-validator",
      agentName: "Citation Validator",
      status: "succeeded",
      startedAt: iso(60_000),
      finishedAt: iso(59_600),
      durationMs: 400,
      trigger: "event",
      costUsd: 0.01,
      toolsCalled: 0,
    },
    {
      id: "run-004",
      agentId: "drafting",
      agentName: "Drafting Agent",
      status: "succeeded",
      startedAt: iso(3 * 3_600_000),
      finishedAt: iso(3 * 3_600_000 + 12_400),
      durationMs: 12_400,
      trigger: "manual",
      triggeredBy: "aisyah@technova.my",
      tokensIn: 4_800,
      tokensOut: 5_200,
      costUsd: 0.34,
      toolsCalled: 1,
    },
    {
      id: "run-005",
      agentId: "report-worker",
      agentName: "Report Worker",
      status: "failed",
      startedAt: iso(45 * 60_000),
      finishedAt: iso(45 * 60_000 + 3_200),
      durationMs: 3_200,
      trigger: "scheduled",
      error: "Timeout: dataset exceeds 500MB",
    },
  ];

  const audit: AgentAuditEvent[] = [
    { id: "a1", agentId: "irac-engine", agentName: "IRAC Engine", kind: "started", timestamp: iso(2_000), actorName: "matter-246", message: "Run run-001 started" },
    { id: "a2", agentId: "citation-validator", agentName: "Citation Validator", kind: "finished", timestamp: iso(60_000), message: "Validated 12 citations" },
    { id: "a3", agentId: "report-worker", agentName: "Report Worker", kind: "failed", timestamp: iso(45 * 60_000), message: "Timeout: dataset exceeds 500MB" },
    { id: "a4", agentId: "drafting", agentName: "Drafting Agent", kind: "capability-granted", timestamp: iso(2 * 86_400_000), actorName: "aisyah@technova.my", message: "Granted documents.write" },
    { id: "a5", agentId: "critic", agentName: "Critic", kind: "budget-adjusted", timestamp: iso(3 * 86_400_000), actorName: "system", message: "Daily budget raised to $15" },
  ];

  const skills: AgentSkill[] = [
    { id: "case-summarization", name: "Case summarization", category: "research", description: "Summarise a case from its judgment PDF.", agentIds: ["retrieval", "irac-engine"], goldenCases: 24, passRate: 0.92 },
    { id: "clause-extraction", name: "Clause extraction", category: "review", description: "Segment contracts into typed clauses.", agentIds: ["retrieval", "curator"], goldenCases: 60, passRate: 0.88 },
    { id: "risk-analysis", name: "Risk analysis", category: "review", description: "Identify and score material risks.", agentIds: ["critic", "irac-engine"], goldenCases: 48, passRate: 0.81 },
    { id: "demand-letter", name: "Demand letter drafting", category: "drafting", description: "Draft a demand letter from matter facts.", agentIds: ["drafting", "critic"], goldenCases: 20, passRate: 0.95 },
    { id: "pdpa-check", name: "PDPA compliance check", category: "compliance", description: "Check a clause against PDPA 2010.", agentIds: ["compliance-worker"], goldenCases: 40, passRate: 0.98 },
  ];

  const totalBudget = agents.reduce((s, a) => s + (a.dailyBudgetUsd ?? 0), 0);
  const totalSpend = agents.reduce((s, a) => s + (a.spentTodayUsd ?? 0), 0);

  const stats: AgentStats = {
    total: agents.length,
    running: agents.filter((a) => a.status === "running" || a.status === "thinking").length,
    idle: agents.filter((a) => a.status === "idle").length,
    error: agents.filter((a) => a.status === "error").length,
    killed: agents.filter((a) => a.killed).length,
    runs24h: runs.length + 217,
    failureRate24h: 0.019,
    totalSpendTodayUsd: totalSpend,
    totalBudgetTodayUsd: totalBudget,
    activeRuns: runs.filter((r) => r.status === "running").length,
    pendingHitl: 6,
  };

  return { agents, stats, runs, audit, skills };
}

export function getAgentTierLabel(tier: string): string {
  switch (tier) {
    case "orchestrator": return "Orchestrator";
    case "tier1": return "Tier 1 — Reasoning";
    case "tier2": return "Tier 2 — Workers";
    case "tier3": return "Tier 3 — Review";
    default: return tier;
  }
}

export function getRunStatusTone(status: RunStatus): string {
  switch (status) {
    case "queued": return "bg-muted text-muted-foreground";
    case "running": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "waiting": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "succeeded": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "failed": return "bg-destructive/10 text-destructive";
    case "cancelled": return "bg-muted text-muted-foreground line-through";
    case "timeout": return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
  }
}

export function getAgentStatusTone(status: AgentStatus): string {
  switch (status) {
    case "idle": return "bg-muted text-muted-foreground";
    case "running": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "thinking": return "bg-violet-500/10 text-violet-600 dark:text-violet-400";
    case "waiting": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "paused": return "bg-muted text-muted-foreground";
    case "error": return "bg-destructive/10 text-destructive";
    case "disabled": return "bg-muted text-muted-foreground line-through";
  }
}
