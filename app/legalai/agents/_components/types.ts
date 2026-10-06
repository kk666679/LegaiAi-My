// app/legalai/agents/_components/types.ts

export type AgentTier = "orchestrator" | "tier1" | "tier2" | "tier3";

export type AgentKind =
  | "orchestrator"
  | "content"
  | "scheduling"
  | "social-listening"
  | "video"
  | "cost"
  | "device-control"
  | "fleet"
  | "profile"
  | "provisioning"
  | "security"
  | "workflow"
  | "compliance-worker"
  | "diagnostic-worker"
  | "notification-worker"
  | "remediation-worker"
  | "report-worker"
  | "validation-worker"
  | "critic"
  | "curator"
  | "evaluator";

export type AgentStatus =
  | "idle"
  | "running"
  | "thinking"
  | "waiting"
  | "paused"
  | "error"
  | "disabled";

export type RunStatus =
  | "queued"
  | "running"
  | "waiting"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "timeout";

export type CapabilityScope =
  | "documents.read"
  | "documents.write"
  | "matters.read"
  | "matters.write"
  | "contracts.read"
  | "contracts.write"
  | "billing.read"
  | "billing.write"
  | "hitl.enqueue"
  | "ai.generate"
  | "ai.analyse"
  | "web.search"
  | "legal.research"
  | "notify.email"
  | "notify.slack"
  | "workflow.execute";

export interface Agent {
  id: string;
  name: string;
  kind: AgentKind;
  tier: AgentTier;
  status: AgentStatus;
  description?: string;
  model?: string;
  /** Capabilities the agent has been granted */
  capabilities: CapabilityScope[];
  /** Peak concurrency the agent is allowed */
  maxConcurrency?: number;
  /** Token budget per run */
  tokenBudgetPerRun?: number;
  /** Cost budget per day (in USD) */
  dailyBudgetUsd?: number;
  /** Actual spend today */
  spentTodayUsd?: number;
  /** Success rate over the last 7 days */
  successRate7d?: number;
  /** Average duration of a run, ms */
  avgDurationMs?: number;
  /** Last time the agent ran */
  lastRunAt?: string;
  /** When it was registered */
  registeredAt: string;
  /** Emergency kill switch is active */
  killed?: boolean;
  /** Free-form tags */
  tags?: string[];
}

export interface AgentRun {
  id: string;
  agentId: string;
  agentName: string;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  trigger: "manual" | "scheduled" | "event" | "webhook" | "queue";
  triggeredBy?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  toolsCalled?: number;
  /** Ordered steps of the run */
  steps?: RunStep[];
}

export interface RunStep {
  id: string;
  kind: "plan" | "reason" | "tool" | "artifact" | "decision" | "wait";
  label: string;
  status: "pending" | "active" | "complete" | "failed";
  startedAt: string;
  finishedAt?: string;
  detail?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: string;
  confidence?: number;
}

export interface AgentSkill {
  id: string;
  name: string;
  category: "research" | "drafting" | "review" | "negotiation" | "compliance" | "ops";
  description: string;
  agentIds: string[];
  /** Golden test cases available */
  goldenCases?: number;
  /** Pass rate on golden set */
  passRate?: number;
}

export interface AgentStats {
  total: number;
  running: number;
  idle: number;
  error: number;
  killed: number;
  runs24h: number;
  failureRate24h: number;
  totalSpendTodayUsd: number;
  totalBudgetTodayUsd: number;
  /** Number of live runs */
  activeRuns: number;
  /** Pending review items created by agents */
  pendingHitl: number;
}

export interface AgentAuditEvent {
  id: string;
  agentId: string;
  agentName: string;
  kind:
    | "registered"
    | "started"
    | "finished"
    | "failed"
    | "killed"
    | "revived"
    | "capability-granted"
    | "capability-revoked"
    | "budget-adjusted"
    | "model-switched";
  actorId?: string;
  actorName?: string;
  timestamp: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentBudget {
  agentId: string;
  dayUsdLimit: number;
  dayUsdSpent: number;
  weekUsdLimit: number;
  weekUsdSpent: number;
  monthUsdLimit: number;
  monthUsdSpent: number;
  tokenLimit: number;
  tokenSpent: number;
  /** When true, agent is stopped automatically at threshold */
  hardStop: boolean;
}

export interface AgentFilters {
  query?: string;
  tier?: AgentTier[];
  status?: AgentStatus[];
  kind?: AgentKind[];
  capabilities?: CapabilityScope[];
}

export type AgentSortKey = "name" | "tier" | "status" | "lastRunAt" | "successRate7d" | "spend";
export type AgentSortDirection = "asc" | "desc";
export interface AgentSort {
  key: AgentSortKey;
  direction: AgentSortDirection;
}

export type AgentViewMode = "grid" | "table";

export interface AgentCapabilities {
  canRun: boolean;
  canPause: boolean;
  canKill: boolean;
  canRevive: boolean;
  canEdit: boolean;
  canViewAudit: boolean;
  canAdjustBudget: boolean;
}
