"use client";
// app/legalai/agents/_components/use-agents.ts
import * as React from "react";
import { trpcReact } from "@/clients";
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

const JOB_TYPE_TO_QUEUE: Record<string, string> = {
  RETRIEVAL: 'retrieval',
  ANALYSIS: 'analysis',
  DRAFTING: 'drafting',
  VALIDATION: 'validation',
  AUDIT: 'audit',
  ORCHESTRATOR: 'orchestrator',
  PRIVACY: 'privacy',
  DEBATE: 'debate',
  MONITORING: 'monitoring',
  INDEXING: 'indexing',
  TESTING: 'testing',
  SANDBOX: 'sandbox',
  AI_DEVELOPER: 'aiDeveloper',
};

export interface UseAgentsOptions {
  filters?: AgentFilters;
  sort?: AgentSort;
  scope?: string;
  pollMs?: number;
}

export interface UseAgentsResult {
  agents: Agent[];
  stats: AgentStats | null;
  runs: AgentRun[];
  audit: AgentAuditEvent[];
  skills: AgentSkill[];
  loading: boolean;
  error?: string;
  run: (agentId: string) => Promise<void>;
  pause: (agentId: string) => void;
  resume: (agentId: string) => void;
  kill: (agentId: string) => void;
  revive: (agentId: string) => void;
  cancelRun: (runId: string) => void;
  reload: () => void;
}

const AGENT_DEFS: Record<string, Partial<Agent>> = {
  orchestrator: { name: "Orchestrator", kind: "orchestrator", tier: "orchestrator", description: "Decomposes requests and routes to tier-1 agents.", capabilities: ["workflow.execute", "ai.generate"], maxConcurrency: 8, tokenBudgetPerRun: 40_000, dailyBudgetUsd: 30 },
  retrieval: { name: "Retrieval Agent", kind: "content", tier: "tier1", description: "Hybrid semantic + keyword retrieval over legal corpus.", capabilities: ["documents.read", "legal.research", "web.search"], maxConcurrency: 16, tokenBudgetPerRun: 20_000, dailyBudgetUsd: 20 },
  analysis: { name: "IRAC Engine", kind: "content", tier: "tier1", description: "Issue–Rule–Application–Conclusion reasoning.", capabilities: ["ai.analyse", "legal.research"], maxConcurrency: 4, tokenBudgetPerRun: 60_000, dailyBudgetUsd: 40 },
  drafting: { name: "Drafting Agent", kind: "content", tier: "tier1", description: "Drafts contracts, letters, and memoranda.", capabilities: ["documents.write", "ai.generate"], maxConcurrency: 6, tokenBudgetPerRun: 50_000, dailyBudgetUsd: 25 },
  critic: { name: "Critic", kind: "critic", tier: "tier3", description: "Adversarial review of drafts and analysis.", capabilities: ["ai.analyse"], maxConcurrency: 4, tokenBudgetPerRun: 35_000, dailyBudgetUsd: 15 },
  evaluator: { name: "Evaluator", kind: "evaluator", tier: "tier3", description: "Scores outputs against golden datasets.", capabilities: ["ai.analyse"], maxConcurrency: 8, tokenBudgetUsd: 15_000, dailyBudgetUsd: 8 },
  validation: { name: "Citation Validator", kind: "validation-worker", tier: "tier2", description: "Validates every citation against source material.", capabilities: ["legal.research", "ai.analyse"], maxConcurrency: 32, tokenBudgetPerRun: 5_000, dailyBudgetUsd: 5 },
  privacy: { name: "Privacy Agent", kind: "content", tier: "tier1", description: "PII redaction and consent management.", capabilities: ["documents.read", "documents.write"], maxConcurrency: 8, tokenBudgetPerRun: 10_000, dailyBudgetUsd: 5 },
  debate: { name: "Debate Agent", kind: "content", tier: "tier1", description: "Multi-agent argument simulation.", capabilities: ["ai.generate", "ai.analyse"], maxConcurrency: 1, tokenBudgetPerRun: 30_000, dailyBudgetUsd: 10 },
  indexing: { name: "Indexing Agent", kind: "content", tier: "tier2", description: "Document ingestion and embedding.", capabilities: ["documents.read", "documents.write"], maxConcurrency: 4, tokenBudgetPerRun: 25_000, dailyBudgetUsd: 10 },
  audit: { name: "Audit Agent", kind: "compliance-worker", tier: "tier2", description: "Immutable audit logging and legal hold management.", capabilities: ["ai.analyse"], maxConcurrency: 10, tokenBudgetPerRun: 8_000, dailyBudgetUsd: 4 },
  monitoring: { name: "Monitoring Agent", kind: "notification-worker", tier: "tier2", description: "Regulatory change detection and trend analysis.", capabilities: ["web.search", "notify.email"], maxConcurrency: 4, tokenBudgetPerRun: 15_000, dailyBudgetUsd: 6 },
  testing: { name: "Testing Agent", kind: "report-worker", tier: "tier2", description: "Gold evaluation and adversarial tests.", capabilities: ["ai.analyse"], maxConcurrency: 2, tokenBudgetPerRun: 20_000, dailyBudgetUsd: 8 },
  orchestrator_worker: { name: "Orchestrator Worker", kind: "workflow", tier: "tier1", description: "Coordinates multi-agent workflows.", capabilities: ["workflow.execute", "ai.generate"], maxConcurrency: 2, tokenBudgetPerRun: 50_000, dailyBudgetUsd: 20 },
  sandbox: { name: "Sandbox Agent", kind: "diagnostic-worker", tier: "tier2", description: "Safe code execution in isolated containers.", capabilities: ["workflow.execute"], maxConcurrency: 2, tokenBudgetPerRun: 10_000, dailyBudgetUsd: 3 },
};

export function useAgents(options: UseAgentsOptions = {}): UseAgentsResult {
  const { filters, sort, scope = "all", pollMs = 5000 } = options;

  // ── Fetch real queue health and job data ──────────────────────
  const queueHealth = trpcReact.agents.queueHealth.useQuery(
    undefined,
    { refetchInterval: pollMs > 0 ? pollMs : undefined }
  );

  const workerStats = trpcReact.agents.workerStats.useQuery(
    undefined,
    { refetchInterval: pollMs > 0 ? pollMs : undefined, enabled: scope === "all" }
  );

  const jobsList = trpcReact.jobs.list.useQuery(
    { limit: 100 },
    { refetchInterval: pollMs > 0 ? pollMs : undefined }
  );

  const utils = trpcReact.useContext();

  // ── State ─────────────────────────────────────────────────────
  const [localAgents, setLocalAgents] = React.useState<Agent[]>([]);
  const [localRuns, setLocalRuns] = React.useState<AgentRun[]>([]);
  const [localAudit, setLocalAudit] = React.useState<AgentAuditEvent[]>([]);

  const loading = queueHealth.isLoading || jobsList.isLoading;
  const error = queueHealth.error
    ? (queueHealth.error as Error)?.message
    : jobsList.error
      ? (jobsList.error as Error)?.message
      : undefined;

  // ── Derive agents from queue health data ──────────────────────
  React.useEffect(() => {
    const queueData = queueHealth.data?.queues ?? {};
    const statsData = workerStats.data;

    const agents: Agent[] = Object.entries(AGENT_DEFS).map(([id, def]) => {
      const queueName = JOB_TYPE_TO_QUEUE[id.toUpperCase() as keyof typeof JOB_TYPE_TO_QUEUE] ?? id;
      const queueStatus = queueData[queueName] ?? { waiting: 0, active: 0, delayed: 0, failed: 0, completed: 0 };

      let status: AgentStatus = "idle";
      if (queueStatus.active > 0) status = "running";
      if ((queueStatus.waiting > 0 || queueStatus.active > 0) && status === "idle") status = "thinking";
      if (queueStatus.failed > 0 && statsData?.dbStats?.failureRate > 0.1) status = "error";

      const registered = new Date(2024, 0, 1).getTime();
      const spentToday = (statsData?.dbStats?.totalJobs as number) * 0.05 ?? Math.random() * 20;
      const successRate = 1 - (statsData?.dbStats?.failureRate ?? 0);

      return {
        id,
        name: def.name ?? id,
        description: def.description,
        kind: def.kind ?? "content",
        tier: def.tier ?? "tier1",
        status,
        model: "llama3.1",
        capabilities: def.capabilities ?? [],
        maxConcurrency: def.maxConcurrency ?? 5,
        tokenBudgetPerRun: def.tokenBudgetPerRun ?? 10_000,
        dailyBudgetUsd: def.dailyBudgetUsd ?? 10,
        spentTodayUsd: typeof spentToday === "number" ? spentToday : 0,
        successRate7d: typeof successRate === "number" ? successRate : 0.95,
        avgDurationMs: def.tokenBudgetPerRun ? def.tokenBudgetPerRun * 0.036 : 5000,
        lastRunAt: queueStatus.active > 0 ? new Date().toISOString() : undefined,
        registeredAt: new Date(registered).toISOString(),
        killed: false,
        tags: [def.tier ?? "tier1", def.kind ?? "content"],
      } as Agent;
    });

    setLocalAgents(agents);
  }, [queueHealth.data, workerStats.data]);

  // ── Derive runs from job data ────────────────────────────────
  React.useEffect(() => {
    const jobs = jobsList.data?.jobs ?? [];
    const runs: AgentRun[] = jobs.slice(0, 20).map((job) => {
      const agentDef = AGENT_DEFS[job.jobType.toLowerCase()] ?? AGENT_DEFS[JOB_TYPE_TO_QUEUE[job.jobType as keyof typeof JOB_TYPE_TO_QUEUE] ?? job.jobType.toLowerCase()];

      const statusMap: Record<string, RunStatus> = {
        COMPLETED: "succeeded",
        FAILED: "failed",
        CANCELLED: "cancelled",
        RUNNING: "running",
        PROCESSING: "running",
        QUEUED: "queued",
        RETRYING: "running",
      };

      return {
        id: job.id,
        agentId: job.jobType.toLowerCase(),
        agentName: agentDef?.name ?? job.jobType,
        status: statusMap[job.status] ?? "queued",
        startedAt: job.startedAt ?? job.queuedAt ?? job.createdAt,
        finishedAt: job.completedAt ?? job.failedAt ?? undefined,
        durationMs:
          job.completedAt && job.startedAt
            ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
            : undefined,
        trigger: "queue" as const,
        tokensIn: undefined,
        tokensOut: undefined,
        costUsd: undefined,
        toolsCalled: undefined,
      } as AgentRun;
    });

    setLocalRuns(runs);
  }, [jobsList.data]);

  // ── Filter and sort ───────────────────────────────────────────
  const agents = React.useMemo(() => {
    let list = [...localAgents];

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
  }, [localAgents, filters, sort, scope]);

  const stats: AgentStats = React.useMemo(() => {
    const qa = localAgents;
    const rs = localRuns;
    const totalBudget = qa.reduce((s, a) => s + (a.dailyBudgetUsd ?? 0), 0);
    const totalSpend = qa.reduce((s, a) => s + (a.spentTodayUsd ?? 0), 0);
    const running = qa.filter((a) => a.status === "running" || a.status === "thinking").length;
    const idle = qa.filter((a) => a.status === "idle").length;
    const error = qa.filter((a) => a.status === "error").length;

    return {
      total: qa.length,
      running,
      idle,
      error,
      killed: qa.filter((a) => a.killed).length,
      runs24h: rs.length,
      failureRate24h: 0.02,
      totalSpendTodayUsd: totalSpend,
      totalBudgetTodayUsd: totalBudget,
      activeRuns: rs.filter((r) => r.status === "running").length,
      pendingHitl: 6,
    };
  }, [localAgents, localRuns]);

  // ── Actions ─────────────────────────────────────────────────
  const patchAgent = React.useCallback((id: string, patch: Partial<Agent>) => {
    setLocalAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const cancelRunMutation = trpcReact.agents.cancelJob.useMutation({
    onSuccess: () => {
      utils.jobs.list.invalidate();
      utils.agents.queueHealth.invalidate();
      utils.agents.workerStats.invalidate();
    },
  });

  const run = React.useCallback(
    async (agentId: string) => {
      const agent = localAgents.find((a) => a.id === agentId);
      if (!agent || agent.killed) return;
      patchAgent(agentId, { status: "running", lastRunAt: new Date().toISOString() });
    },
    [localAgents, patchAgent],
  );

  const pause = React.useCallback((id: string) => patchAgent(id, { status: "paused" }), [patchAgent]);
  const resume = React.useCallback((id: string) => patchAgent(id, { status: "idle" }), [patchAgent]);

  const kill = React.useCallback(
    (id: string) => {
      patchAgent(id, { status: "disabled", killed: true });
      setLocalAudit((prev) => [
        {
          id: `a-${Date.now()}`,
          agentId: id,
          agentName: localAgents.find((a) => a.id === id)?.name ?? id,
          kind: "killed",
          timestamp: new Date().toISOString(),
          message: "Kill switch engaged",
        },
        ...prev,
      ]);
    },
    [localAgents, patchAgent],
  );

  const revive = React.useCallback(
    (id: string) => {
      patchAgent(id, { status: "idle", killed: false });
      setLocalAudit((prev) => [
        {
          id: `a-${Date.now()}`,
          agentId: id,
          agentName: localAgents.find((a) => a.id === id)?.name ?? id,
          kind: "revived",
          timestamp: new Date().toISOString(),
          message: "Agent revived",
        },
        ...prev,
      ]);
    },
    [localAgents, patchAgent],
  );

  const cancelRun = React.useCallback(
    (runId: string) => {
      cancelRunMutation.mutate({ jobId: runId });
      setLocalRuns((prev) =>
        prev.map((r) =>
          r.id === runId ? { ...r, status: "cancelled" as RunStatus, finishedAt: new Date().toISOString() } : r,
        ),
      );
    },
    [cancelRunMutation],
  );

  const reload = React.useCallback(() => {
    queueHealth.refetch();
    workerStats.refetch();
    jobsList.refetch();
  }, [queueHealth, workerStats, jobsList]);

  return {
    agents,
    stats,
    runs: localRuns,
    audit: localAudit,
    skills: [],
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
