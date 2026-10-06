"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Upload,
  Sparkles,
  Briefcase,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  FileText,
  BookOpen,
  Activity,
  Plus,
  Gavel,
  CheckCircle2,
  CircleDashed,
  Server,
  Scale,
  CalendarClock,
  FileSignature,
  Send,
  ShieldCheck,
  Swords,
  BarChart3,
  ClipboardList,
  Bell,
  History,
  Bookmark,
  FileCheck,
  Loader2,
  RefreshCw,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { LegalDisclaimer } from "@/components/lawmate/LegalDisclaimer";
import { CreateMatterDialog } from "@/components/lawmate/CreateMatterDialog";
import { UploadDialog } from "@/components/lawmate/UploadDialog";
import { QuickPromptSheet } from "@/components/lawmate/QuickPromptSheet";
import { CreditUsageDashboard } from "@/components/dashboard/CreditUsageDashboard";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import type { UsageSummary, ActivityItem, SavedResearchItem } from "@/components/dashboard/types";
import { toDashboardSavedItems, toDashboardActivity } from "@/app/legalai/research/_components/legalai-dashboard-adapters";
import { DashboardStateBoundary } from "@/components/dashboard/DashboardState";
import { trpcReact } from "@/clients";
import { useAuth } from "@/components/auth-provider";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { DashboardSkeleton, ListSkeleton } from "@/components/shared/PageSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LawMateMark } from "@/components/navigation/Logo";
import { PROMPT_SUGGESTIONS, DRAFT_TEMPLATES } from "@/lib/lawmate/data";
import { CREDIT_VALUE_PER_UNIT } from "@/lib/pricing-client";
import { greeting, relativeTime } from "@/lib/lawmate/utils";
import { cn } from "@/lib/utils";
import { DOC_TYPES } from "@/hooks/useDocuments";

const DOC_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  DOC_TYPES.map((t) => [t.value, t.label]),
);

// ─────────────────────────────────────────────────────────────
// Local types mirroring the tRPC output shapes. trpcReact is
// intentionally typed as `any` upstream (see clients.ts), so
// we narrow the shapes we actually consume here.
// ─────────────────────────────────────────────────────────────

interface MatterSummary {
  id: string;
  title: string;
  matterNumber: string;
  status: string;
  priority: string;
  matterType?: string;
  updatedAt?: string;
  client?: { id: string; name: string } | null;
  _count?: { agentActions: number; alerts: number };
}

interface DocumentSummary {
  id: string;
  title: string;
  docType: string;
  status: string;
  version: number;
  updatedAt?: string;
  tags?: string[];
}

interface PendingAction {
  id: string;
  agentName: string;
  actionType: string;
  authLevel: number;
  title: string;
  createdAt?: string;
  matter?: { title: string; matterNumber: string } | null;
}

interface AuditEntry {
  id: string;
  agentName: string;
  action: string;
  durationMs?: number | null;
  confidence?: number | null;
  createdAt?: string;
}

interface AttentionRequired {
  deadlineSoon: Array<{
    id: string;
    title: string;
    matterNumber: string;
    deadlineAt?: string | null;
    client?: { name: string } | null;
  }>;
  staleMatters: Array<{ id: string; title: string; matterNumber: string }>;
  criticalAlerts: Array<{
    id: string;
    title: string;
    severity: string;
    matter?: { title: string } | null;
  }>;
}

interface QueueHealth {
  status: "healthy" | "degraded";
  queues: Record<string, { waiting?: number; active?: number; failed?: number }>;
  timestamp?: string;
}

interface MattersStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

interface DocumentsStats {
  total: number;
  byStatus: Record<string, number>;
  recentActivity: number;
}

interface AlertSummary {
  id: string;
  title: string;
  severity: string;
  createdAt?: string;
  matter?: { title: string; matterNumber: string } | null;
}

const MODULES: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Legal Research", href: "/legalai/research", icon: BookOpen },
  { label: "Documents", href: "/legalai/documents", icon: FileText },
  { label: "Document Analysis", href: "/legalai/analysis", icon: ClipboardList },
  { label: "Contracts", href: "/legalai/contracts", icon: FileCheck },
  { label: "Automations", href: "/legalai/automations", icon: Workflow },
  { label: "Risk Engine", href: "/legalai/risk", icon: ShieldCheck },
  { label: "Debate Simulation", href: "/legalai/debate", icon: Swords },
  { label: "Change Monitor", href: "/legalai/monitor", icon: Bell },
  { label: "Analytics", href: "/legalai/analytics", icon: BarChart3 },
  { label: "Audit Trail", href: "/legalai/audit", icon: Gavel },
  { label: "Activity History", href: "/legalai/history", icon: History },
  { label: "Saved Items", href: "/legalai/saved", icon: Bookmark },
];

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "—";
  }
}

/** Whole days until a deadline; negative when already past. */
function daysUntil(iso?: string | null) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.ceil(ms / 86_400_000);
}

function deadlineTone(days: number | null) {
  if (days === null) return { text: "text-muted-foreground", label: "No date", width: "0%" };
  if (days < 0)
    return { text: "text-destructive", label: `${Math.abs(days)}d overdue`, width: "100%" };
  if (days === 0) return { text: "text-destructive", label: "Due today", width: "100%" };
  if (days <= 3)
    return { text: "text-amber-500", label: `${days}d left`, width: "85%" };
  return { text: "text-foreground", label: `${days}d left`, width: "55%" };
}

function humaniseKey(value: string) {
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

interface CreditUsageData {
  currentBalance: number;
  totalAllocated: number;
  totalConsumed: number;
  planCredits: number;
  usagePercentage: number;
  remainingCredits: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    createdAt: Date;
  }> | [];
}

function toUsageSummary(data: CreditUsageData | null | undefined): UsageSummary | null {
  if (!data) return null;
  const used = data.totalConsumed;
  const total = data.totalAllocated || data.planCredits;
  const remaining = data.remainingCredits;
  const percent = data.usagePercentage ?? 0;
  const daily = data.recentTransactions
    ?.slice(0, 7)
    .map((tx) => ({
      label: new Date(tx.createdAt).toLocaleDateString("en-MY", { weekday: "short" }),
      value: Math.abs(tx.amount),
    })) ?? [];
  return {
    totalAllocated: total,
    used,
    remaining,
    percentConsumed: percent,
    daily,
    period: "day",
    valuePerCredit: CREDIT_VALUE_PER_UNIT,
    currency: "MYR",
  };
}

interface AuditLogEntry {
  id: string;
  agentName: string;
  action: string;
  durationMs?: number | null;
  confidence?: number | null;
  createdAt?: string;
}

function toActivityItems(logs: readonly AuditLogEntry[]): ActivityItem[] {
  return logs.map((entry) => ({
    id: entry.id,
    kind: "artifact_generated" as const,
    title: entry.action.replace(/_/g, " "),
    detail: `${entry.agentName}${entry.durationMs != null ? ` · ${entry.durationMs}ms` : ""}${entry.confidence != null ? ` · ${Math.round(entry.confidence * 100)}% confidence` : ""}`,
    at: entry.createdAt ?? new Date().toISOString(),
  }));
}

export default function DashboardHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [askOpen, setAskOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [matterOpen, setMatterOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [ask, setAsk] = useState("");
  const askRef = useRef<HTMLInputElement>(null);

  useEffect(() => setNow(new Date()), []);

  // Real workspace data — no fabricated metrics.
  const me = trpcReact.auth.me.useQuery(undefined, { staleTime: 60_000 });
  const mattersStats = trpcReact.matters.stats.useQuery(undefined, {
    staleTime: 30_000,
  });
  const mattersList = trpcReact.matters.list.useQuery(
    { limit: 5 },
    { staleTime: 30_000 },
  );
  const docsStats = trpcReact.documents.stats.useQuery(undefined, {
    staleTime: 30_000,
  });
  const docsList = trpcReact.documents.list.useQuery(
    { limit: 5 },
    { staleTime: 30_000 },
  );
  const attention = trpcReact.matters.getAttentionRequired.useQuery(
    undefined,
    { staleTime: 30_000 },
  );
  const alerts = trpcReact.matters.getAlerts.useQuery(
    { limit: 10 },
    { staleTime: 30_000 },
  );
  const pendingActions = trpcReact.hitl.listPending.useQuery(
    { limit: 5 },
    { staleTime: 30_000 },
  );
  const queueHealth = trpcReact.agents.queueHealth.useQuery(undefined, {
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
  const creditUsage = trpcReact.subscription.getCreditUsage.useQuery(undefined, {
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
  const logs = trpcReact.agents.getAuditLogs.useQuery(
    { limit: 8 },
    { staleTime: 30_000 },
  );

  const displayName =
    user?.name ?? me.data?.name ?? user?.email?.split("@")[0] ?? "there";
  const orgName = user?.org?.name ?? me.data?.org?.name;

  const mStats = (mattersStats.data ?? null) as MattersStats | null;
  const dStats = (docsStats.data ?? null) as DocumentsStats | null;
  const recentMatters = ((mattersList.data as { matters?: MatterSummary[] } | undefined)?.matters ?? []) as MatterSummary[];
  const recentDocs = ((docsList.data as { documents?: DocumentSummary[] } | undefined)?.documents ?? []) as DocumentSummary[];
  const attentionData = (attention.data ?? null) as AttentionRequired | null;
  const pending = ((pendingActions.data ?? []) as PendingAction[]).slice(0, 5);
  const openAlerts = ((alerts.data ?? []) as AlertSummary[]).slice(0, 4);
  const health = (queueHealth.data ?? null) as QueueHealth | null;
  const usageSummary = toUsageSummary(creditUsage.data ?? null);
  const auditItems = useMemo(() => toActivityItems((logs.data ?? []) as AuditLogEntry[]), [logs.data]);
  const auditStatus = logs.isLoading ? "loading" : logs.isError ? "error" : "success";
  const logsError = logs.error ?? null;

  const activeMatters =
    (mStats?.byStatus.active ?? 0) + (mStats?.byStatus.open ?? 0);
  const urgentMatters = mStats?.byPriority.urgent ?? mStats?.byPriority.high ?? 0;
  const docsInReview = dStats?.byStatus.review ?? 0;
  const docsDraft = dStats?.byStatus.draft ?? 0;

  const dateLabel = now
    ? now.toLocaleDateString("en-MY", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : " ";

  const attentionItems = useMemo(() => {
    if (!attentionData) return [];
    return [
      ...attentionData.deadlineSoon.slice(0, 3).map((m) => ({
        id: m.id,
        kind: "deadline" as const,
        title: m.title,
        detail: `Deadline ${formatDate(m.deadlineAt)}${m.client ? ` · ${m.client.name}` : ""}`,
        href: "/legalai/matters",
      })),
      ...attentionData.criticalAlerts.slice(0, 2).map((a) => ({
        id: a.id,
        kind: "alert" as const,
        title: a.title,
        detail: `Critical alert${a.matter ? ` · ${a.matter.title}` : ""}`,
        href: "/legalai/notifications",
      })),
      ...attentionData.staleMatters.slice(0, 2).map((m) => ({
        id: m.id,
        kind: "stale" as const,
        title: m.title,
        detail: "No activity in 21+ days",
        href: "/legalai/matters",
      })),
    ].slice(0, 5);
  }, [attentionData]);

  /** Real deadline list with a countdown, then stale matters as a fallback. */
  const timeline = useMemo(() => {
    if (!attentionData) return [];
    const deadlines = attentionData.deadlineSoon
      .map((m) => ({
        id: m.id,
        kind: "deadline" as const,
        title: m.title,
        subtitle: m.client?.name ?? m.matterNumber,
        when: m.deadlineAt ?? null,
      }))
      .sort((a, b) => (a.when ?? "").localeCompare(b.when ?? ""));
    const stale = attentionData.staleMatters.slice(0, 3).map((m) => ({
      id: m.id,
      kind: "stale" as const,
      title: m.title,
      subtitle: m.matterNumber,
      when: null as string | null,
    }));
    return [...deadlines, ...stale];
  }, [attentionData]);

  /** Distribution bars built from the real stats aggregates. */
  const workload = useMemo(() => {
    const norm = (record?: Record<string, number>) =>
      Object.entries(record ?? {})
        .map(([key, value]) => ({ key, value: value ?? 0 }))
        .filter((row) => row.value > 0)
        .sort((a, b) => b.value - a.value);
    return {
      mattersByStatus: norm(mStats?.byStatus),
      mattersByPriority: norm(mStats?.byPriority),
      docsByStatus: norm(dStats?.byStatus),
    };
  }, [mStats, dStats]);

  const loading =
    mattersStats.isLoading ||
    mattersList.isLoading ||
    docsStats.isLoading ||
    docsList.isLoading ||
    attention.isLoading;

  // Any core query failing should be surfaced rather than silently rendering
  // an empty workspace — an empty dashboard is indistinguishable from a
  // genuinely empty one otherwise.
  const failed = [
    mattersStats.error && "matters",
    mattersList.error && "the matters list",
    docsStats.error && "document statistics",
    docsList.error && "the document list",
    attention.error && "attention items",
  ].filter(Boolean) as string[];

  const isRefreshing =
    mattersStats.isRefetching ||
    docsStats.isRefetching ||
    mattersList.isRefetching ||
    docsList.isRefetching;

  const refreshAll = () => {
    void mattersStats.refetch();
    void mattersList.refetch();
    void docsStats.refetch();
    void docsList.refetch();
    void attention.refetch();
    void alerts.refetch();
    void pendingActions.refetch();
    void queueHealth.refetch();
  };

  const submitAsk = (value: string) => {
    const text = value.trim();
    if (!text) return;
    router.push(`/legalai/assistant?q=${encodeURIComponent(text)}`);
  };

  return (
    <DashboardShell>
      {loading && !mattersStats.data ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* ── Welcome header ─────────────────────────────── */}
          <PageHeader
            title={`${greeting()}, ${displayName.split(" ")[0]}`}
            description={
              <>
                {dateLabel}
                {orgName ? (
                  <>
                    {" · "}
                    <span className="inline-flex items-center gap-1">
                      <Scale className="size-3" aria-hidden />
                      {orgName}
                    </span>
                  </>
                ) : null}
              </>
            }
            actions={
              <>
                <Button
                  onClick={refreshAll}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isRefreshing}
                  aria-label="Refresh workspace data"
                >
                  {isRefreshing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Refresh
                </Button>
                <Button onClick={() => setAskOpen(true)} size="sm" className="gap-2">
                  <Bot className="size-4" /> Ask LawMate
                </Button>
                <Button
                  onClick={() => setUploadOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Upload className="size-4" /> Upload
                </Button>
                <Button
                  onClick={() => setMatterOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="size-4" /> New matter
                </Button>
              </>
            }
          />

          <LegalDisclaimer compact />

          {failed.length > 0 && (
            <Alert variant="destructive" className="border-destructive/30">
              <AlertTriangle className="size-4" />
              <div className="min-w-0 flex-1">
                <AlertTitle>Some workspace data could not be loaded</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-3">
                  <span>
                    Failed: {failed.join(", ")}. Figures below may be incomplete.
                  </span>
                  <Button size="sm" variant="outline" onClick={refreshAll}>
                    Retry
                  </Button>
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* ── Ask bar + module shortcuts ─────────────────── */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitAsk(ask);
                }}
              >
                <div className="relative min-w-0 flex-1">
                  <Bot
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    ref={askRef}
                    value={ask}
                    onChange={(e) => setAsk(e.target.value)}
                    placeholder="Ask about your matters, deadlines, documents or Malaysian law…"
                    aria-label="Ask LawMate"
                    className="h-11 w-full rounded-lg border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <Button type="submit" className="h-11 gap-2" disabled={!ask.trim()}>
                  <Send className="size-4" /> Ask
                </Button>
              </form>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {MODULES.map((m) => {
                  const Icon = m.icon;
                  return (
                    <Link
                      key={m.href}
                      href={m.href}
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                    >
                      <Icon className="size-3" aria-hidden />
                      {m.label}
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── Attention required (real deadlines & alerts) ── */}
          {attentionItems.length > 0 && (
            <Alert variant="destructive" className="border-destructive/30">
              <AlertTriangle className="size-4" />
              <div className="min-w-0 flex-1">
                <AlertTitle>Needs attention</AlertTitle>
                <AlertDescription>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                    {attentionItems.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
                      >
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            item.kind === "deadline" && "bg-amber-500",
                            item.kind === "alert" && "bg-destructive",
                            item.kind === "stale" && "bg-muted-foreground",
                          )}
                          aria-hidden
                        />
                        <span className="truncate">{item.title}</span>
                        <span className="text-xs opacity-70">{item.detail}</span>
                      </Link>
                    ))}
                  </div>
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* ── Workspace metrics (real counts) ─────────────── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              label="Active matters"
              value={activeMatters}
              icon={Briefcase}
              sub={
                urgentMatters > 0
                  ? `${urgentMatters} high priority`
                  : `${mStats?.total ?? 0} total`
              }
              href="/legalai/matters"
              loading={mattersStats.isLoading}
            />
            <MetricCard
              label="Documents"
              value={dStats?.total ?? 0}
              icon={FileText}
              sub={
                docsDraft > 0 || docsInReview > 0
                  ? `${docsDraft} draft · ${docsInReview} in review`
                  : `${dStats?.recentActivity ?? 0} updated this month`
              }
              href="/legalai/documents"
              loading={docsStats.isLoading}
            />
            <MetricCard
              label="Pending AI approvals"
              value={pendingActions.data?.length ?? 0}
              icon={CircleDashed}
              sub="Awaiting human review"
              href="/legalai/hitl"
              loading={pendingActions.isLoading}
            />
            <MetricCard
              label="Open alerts"
              value={alerts.data?.length ?? 0}
              icon={AlertTriangle}
              sub={
                attentionData
                  ? `${attentionData.deadlineSoon.length} deadlines in 8 days`
                  : "Unacknowledged"
              }
              href="/legalai/notifications"
              loading={alerts.isLoading}
            />
          </div>

          {/* ── Matters + Pending approvals ─────────────────── */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="size-4 text-primary" /> Matters
                    </CardTitle>
                    <CardDescription>
                      Recently updated legal matters in your workspace.
                    </CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                    <Link href="/legalai/matters">
                      View all <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {mattersList.isLoading ? (
                  <ListSkeleton rows={4} />
                ) : recentMatters.length === 0 ? (
                  <EmptyState
                    icon={Briefcase}
                    title="No matters yet"
                    description="Create your first matter to start tracking cases, documents and AI activity."
                    action="Create matter"
                    actionHref="/legalai/matters"
                  />
                ) : (
                  <div className="space-y-2">
                    {recentMatters.map((m) => (
                      <Link
                        key={m.id}
                        href="/legalai/matters"
                        className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent/40"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Gavel className="size-4 text-muted-foreground" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {m.title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate">{m.matterNumber}</span>
                            {m.client?.name && (
                              <>
                                <span aria-hidden>·</span>
                                <span className="truncate">{m.client.name}</span>
                              </>
                            )}
                            {m._count && (
                              <>
                                <span aria-hidden>·</span>
                                <span>
                                  {m._count.agentActions} AI actions
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <StatusBadge value={m.priority} className="hidden sm:inline-flex" />
                        <StatusBadge value={m.status} className="hidden sm:inline-flex" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CircleDashed className="size-4 text-primary" /> Pending approvals
                    </CardTitle>
                    <CardDescription>
                      AI actions awaiting human authorisation.
                    </CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                    <Link href="/legalai/hitl">
                      <ArrowUpRight className="size-3" />
                      <span className="sr-only">Open agent control</span>
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {pendingActions.isLoading ? (
                  <ListSkeleton rows={4} />
                ) : pending.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="All caught up"
                    description="No AI actions are waiting for approval."
                  />
                ) : (
                  <div className="space-y-2">
                    {pending.map((a) => (
                      <Link
                        key={a.id}
                        href="/legalai/hitl"
                        className="flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-accent/40"
                      >
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Bot className="size-3.5 text-muted-foreground" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{a.title}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {a.matter?.title
                              ? `${a.matter.title} · `
                              : ""}
                            {a.agentName} · L{a.authLevel}
                            {a.createdAt ? ` · ${relativeTime(a.createdAt)}` : ""}
                          </p>
                        </div>
                        <StatusBadge
                          value={a.authLevel >= 3 ? "urgent" : "pending"}
                          label={`L${a.authLevel}`}
                          className="hidden sm:inline-flex"
                        />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Documents + AI activity ─────────────────────── */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="size-4 text-primary" /> Recent documents
                    </CardTitle>
                    <CardDescription>
                      Latest documents across the workspace.
                    </CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                    <Link href="/legalai/documents">
                      View all <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {docsList.isLoading ? (
                  <ListSkeleton rows={4} />
                ) : recentDocs.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No documents yet"
                    description="Upload a contract, brief or memorandum to analyse it with AI."
                    action="Upload document"
                    actionHref="/legalai/documents"
                  />
                ) : (
                  <div className="space-y-2">
                    {recentDocs.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent/40"
                      >
                        <Link
                          href={`/legalai/documents/${d.id}`}
                          className="flex min-w-0 flex-1 items-center gap-3"
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                            <FileText className="size-4 text-muted-foreground" aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{d.title}</p>
                            <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{DOC_TYPE_LABEL[d.docType] ?? d.docType.toLowerCase()}</span>
                              <span aria-hidden>·</span>
                              <span>v{d.version}</span>
                              {d.updatedAt && (
                                <>
                                  <span aria-hidden>·</span>
                                  <span>{relativeTime(d.updatedAt)}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </Link>
                        <StatusBadge value={d.status} className="hidden sm:inline-flex" />
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                          aria-label={`Analyse ${d.title}`}
                        >
                          <Link href={`/legalai/analysis?documentId=${d.id}`}>
                            <Sparkles className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

             <PermissionGate permission="view_audit_log">
               <RecentActivityFeed
                 heading="AI activity"
                 items={auditItems}
                 status={auditStatus}
                 error={logsError}
                 onRetry={logs.refetch}
               />
             </PermissionGate>
          </div>

          {/* ── Deadlines · workload · analysis · drafting ──── */}
          <div className="grid gap-4 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="size-4 text-primary" /> Deadlines
                </CardTitle>
                <CardDescription>
                  {attentionData?.deadlineSoon.length
                    ? `${attentionData.deadlineSoon.length} within 8 days, plus stale matters.`
                    : "No imminent deadlines detected."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attention.isLoading ? (
                  <ListSkeleton rows={4} />
                ) : timeline.length === 0 ? (
                  <EmptyState
                    icon={CalendarClock}
                    title="Nothing due"
                    description="Deadlines inside the next 8 days appear here automatically."
                  />
                ) : (
                  <div className="space-y-2.5">
                    {timeline.slice(0, 6).map((item) => {
                      const days = item.kind === "deadline" ? daysUntil(item.when) : null;
                      const tone = item.kind === "stale"
                        ? { text: "text-muted-foreground", label: "Stale 21d+", width: "20%" }
                        : deadlineTone(days);
                      return (
                        <Link
                          key={`${item.kind}-${item.id}`}
                          href="/legalai/matters"
                          className="block rounded-md border p-3 transition-colors hover:bg-accent/40"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 truncate text-sm font-medium">{item.title}</p>
                            <span className={cn("shrink-0 text-[11px] font-medium tabular-nums", tone.text)}>
                              {item.kind === "deadline" ? (item.when ? formatDate(item.when) : "—") : "No activity"}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {item.subtitle}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                              <span
                                className={cn(
                                  "block h-full rounded-full",
                                  tone.text.includes("destructive")
                                    ? "bg-destructive"
                                    : tone.text.includes("amber")
                                      ? "bg-amber-500"
                                      : "bg-primary",
                                )}
                                style={{ width: tone.width }}
                                aria-hidden
                              />
                            </span>
                            <span className={cn("shrink-0 text-[10px] font-medium", tone.text)}>
                              {tone.label}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="size-4 text-primary" /> Workload
                </CardTitle>
                <CardDescription>
                  Matter and document distribution across your workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mattersStats.isLoading || docsStats.isLoading ? (
                  <ListSkeleton rows={5} />
                ) : (
                  <>
                    <Distribution
                      title="Matters by status"
                      rows={workload.mattersByStatus}
                      total={mStats?.total ?? 0}
                    />
                    <Distribution
                      title="Matters by priority"
                      rows={workload.mattersByPriority}
                      total={mStats?.total ?? 0}
                    />
                    <Distribution
                      title="Documents by status"
                      rows={workload.docsByStatus}
                      total={dStats?.total ?? 0}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <DraftingLauncher />

            <DocumentAnalysisCard total={dStats?.total ?? 0} latest={recentDocs[0] ?? null} />
          </div>

          {/* ── Quick prompts + system status ───────────────── */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-primary" /> Quick prompts
                </CardTitle>
                <CardDescription>Tap to start an AI conversation.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {PROMPT_SUGGESTIONS.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => submitAsk(p.prompt)}
                      className="rounded-md border bg-card/50 p-3 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-3 text-primary" aria-hidden />
                        <span className="font-medium">{p.label}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                        {p.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="size-4 text-primary" /> Research shortcuts
                </CardTitle>
                <CardDescription>Start from verified Malaysian sources.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Employment Act 1955", href: "/legalai/research" },
                  { label: "Contracts Act 1950", href: "/legalai/research" },
                  { label: "PDPA 2010", href: "/legalai/research" },
                  { label: "Industrial Relations Act 1967", href: "/legalai/research" },
                ].map((s) => (
                  <Link
                    key={s.label}
                    href={s.href}
                    className="flex items-center gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-accent/40"
                  >
                    <BookOpen className="size-4 text-muted-foreground" aria-hidden />
                    <span className="flex-1 truncate">{s.label}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
                  </Link>
                ))}
              </CardContent>
            </Card>

            <DashboardStateBoundary
              status={creditUsage.isError ? "error" : creditUsage.data ? "success" : "loading"}
              isEmpty={false}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Server className="size-4 text-primary" /> System status
                  </CardTitle>
                  <CardDescription>Agent queue health and credit balance.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <CreditUsageDashboard
                      summary={usageSummary ?? { totalAllocated: 0, used: 0, remaining: 0, percentConsumed: 0, daily: [], period: "day", valuePerCredit: CREDIT_VALUE_PER_UNIT, currency: "MYR" }}
                      status={creditUsage.isError ? "error" : creditUsage.data ? "success" : "loading"}
                      onRetry={() => creditUsage.refetch()}
                      error={creditUsage.error ?? null}
                    />
                    {health && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              health.status === "healthy"
                                ? "bg-emerald-500"
                                : "bg-amber-500",
                            )}
                            aria-hidden
                          />
                          <p className="text-sm font-medium capitalize">
                            {health.status === "healthy" ? "All systems operational" : "Degraded performance"}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          {Object.entries(health.queues).map(([name, counts]) => (
                            <div
                              key={name}
                              className="flex items-center justify-between rounded-md border bg-card/40 px-2.5 py-1.5 text-xs"
                            >
                              <span className="font-medium text-muted-foreground">
                                {name}
                              </span>
                              <span className="flex items-center gap-2 tabular-nums">
                                {counts.waiting ? (
                                  <span className="text-amber-500">{counts.waiting} waiting</span>
                                ) : (
                                  <span className="text-muted-foreground">idle</span>
                                )}
                                {counts.failed ? (
                                  <span className="text-destructive">{counts.failed} failed</span>
                                ) : null}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </DashboardStateBoundary>
          </div>

          {/* ── Open alerts (real, unacknowledged) ──────────── */}
          {openAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="size-4 text-primary" /> Open alerts
                    </CardTitle>
                    <CardDescription>
                      Unacknowledged alerts across your matters.
                    </CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                    <Link href="/legalai/notifications">
                      View all <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {openAlerts.map((a) => (
                    <Link
                      key={a.id}
                      href="/legalai/notifications"
                      className="flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-accent/40"
                    >
                      <AlertTriangle
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          a.severity === "critical" || a.severity === "high"
                            ? "text-destructive"
                            : "text-amber-500",
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {a.matter ? `${a.matter.title} · ` : ""}
                          {a.createdAt ? relativeTime(a.createdAt) : ""}
                        </p>
                      </div>
                      <StatusBadge value={a.severity === "critical" ? "critical" : a.severity} />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Onboarding when the workspace is empty ──────── */}
          {recentMatters.length === 0 &&
            recentDocs.length === 0 &&
            (pendingActions.data?.length ?? 0) === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <LawMateMark size="lg" className="text-muted-foreground/40" aria-hidden="true" />
                  <div>
                    <h3 className="text-lg font-semibold">Welcome to your workspace</h3>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                      Ask a question, upload a document or research Malaysian law
                      to get started. Everything stays inside your organisation.
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 justify-center">
                    <Button onClick={() => setAskOpen(true)} className="gap-2">
                      <Bot className="size-4" /> Ask a legal question
                    </Button>
                    <Button onClick={() => setUploadOpen(true)} variant="outline" className="gap-2">
                      <Upload className="size-4" /> Analyse a document
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                      <Link href="/legalai/draft">
                        <FileSignature className="size-4" /> Open Drafting Studio
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                      <Link href="/legalai/research">
                        <BookOpen className="size-4" /> Research Malaysian law
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      )}

      <QuickPromptSheet open={askOpen} onOpenChange={setAskOpen} />
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <CreateMatterDialog open={matterOpen} onOpenChange={setMatterOpen} />
    </DashboardShell>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  sub,
  href,
  loading,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  sub?: string;
  href: string;
  loading?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-primary/30">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Icon className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-1 h-6 w-16" />
            ) : (
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {value}
              </p>
            )}
            {sub && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {sub}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/** Horizontal bar list built from a real aggregate record. */
function Distribution({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { key: string; value: number }[];
  total: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <span className="text-[11px] tabular-nums text-muted-foreground">{total}</span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-1.5 text-[11px] text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {rows.map((row) => {
            const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
            return (
              <li key={row.key} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground">{humaniseKey(row.key)}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {row.value} · {pct}%
                  </span>
                </div>
                <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary/70"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                    aria-hidden
                  />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Quick-start bridge into the real Document Analysis module. */
function DocumentAnalysisCard({
  total,
  latest,
}: {
  total: number;
  latest: DocumentSummary | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="size-4 text-primary" /> Document Analysis
        </CardTitle>
        <CardDescription>
          Extract clauses, risks and a quality score. Every finding quotes its source.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {total > 0
            ? `${total} document${total === 1 ? "" : "s"} ready to analyse in your library.`
            : "Upload a document to run clause and risk extraction."}
        </p>
        {latest && (
          <Link
            href={`/legalai/analysis?documentId=${latest.id}`}
            className="flex items-center gap-3 rounded-md border bg-card/40 p-3 text-sm transition-colors hover:bg-accent/40"
          >
            <FileText className="size-4 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{latest.title}</span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
              Analyse <ArrowRight className="size-3.5" aria-hidden />
            </span>
          </Link>
        )}
        <Button asChild variant="outline" size="sm" className="w-full gap-2">
          <Link href="/legalai/analysis">
            <Sparkles className="size-4" /> Open Document Analysis
          </Link>
        </Button>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Rule-based extraction at HITL level 1 — a lawyer reviews the result before
          it is relied on.
        </p>
      </CardContent>
    </Card>
  );
}

/** Bridge card from the workspace into the Drafting Studio. */
function DraftingLauncher() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSignature className="size-4 text-primary" /> Drafting Studio
        </CardTitle>
        <CardDescription>
          Start from a Malaysian template. Citations and a quality score come with it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {DRAFT_TEMPLATES.slice(0, 6).map((t) => (
            <Link
              key={t.id}
              href={`/legalai/draft?template=${t.id}`}
              title={t.description}
              className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              {t.label}
            </Link>
          ))}
        </div>
        <Link
          href="/legalai/draft"
          className="flex items-center justify-between rounded-md border bg-card/40 p-3 text-sm transition-colors hover:bg-accent/40"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden />
            Open the full studio
          </span>
          <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
        </Link>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Drafts are generated at HITL level 2 — a lawyer must review before the work product is
          used.
        </p>
      </CardContent>
    </Card>
  );
}
