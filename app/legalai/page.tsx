"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { trpcReact } from "@/clients";
import { useAuth } from "@/components/auth-provider";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  EmptyState,
} from "@/components/shared/EmptyState";
import {
  DashboardSkeleton,
  ListSkeleton,
} from "@/components/shared/PageSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PROMPT_SUGGESTIONS } from "@/lib/lawmate/data";
import { greeting, relativeTime } from "@/lib/lawmate/utils";
import { cn } from "@/lib/utils";

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

export default function DashboardHomePage() {
  const { user } = useAuth();
  const [askOpen, setAskOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [matterOpen, setMatterOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

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

  const displayName =
    user?.name ?? me.data?.name ?? user?.email?.split("@")[0] ?? "there";
  const orgName = user?.org?.name ?? me.data?.org?.name;

  const mStats = (mattersStats.data ?? null) as MattersStats | null;
  const dStats = (docsStats.data ?? null) as DocumentsStats | null;
  const recentMatters = ((mattersList.data as { matters?: MatterSummary[] } | undefined)?.matters ?? []) as MatterSummary[];
  const recentDocs = ((docsList.data as { documents?: DocumentSummary[] } | undefined)?.documents ?? []) as DocumentSummary[];
  const attentionData = (attention.data ?? null) as AttentionRequired | null;
  const pending = ((pendingActions.data ?? []) as PendingAction[]).slice(0, 5);
  const openAlerts = (alerts.data ?? []).slice(0, 4);
  const health = (queueHealth.data ?? null) as QueueHealth | null;

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

  const loading =
    mattersStats.isLoading ||
    mattersList.isLoading ||
    docsStats.isLoading ||
    docsList.isLoading ||
    attention.isLoading;

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
                      <Link
                        key={d.id}
                        href={`/legalai/analysis?documentId=${d.id}`}
                        className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent/40"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                          <FileText className="size-4 text-muted-foreground" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{d.title}</p>
                          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{d.docType.toLowerCase()}</span>
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
                        <StatusBadge value={d.status} className="hidden sm:inline-flex" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <PermissionGate permission="view_audit_log">
              <AuditActivityCard />
            </PermissionGate>
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
                      onClick={() => setAskOpen(true)}
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Server className="size-4 text-primary" /> System status
                </CardTitle>
                <CardDescription>Agent queue health.</CardDescription>
              </CardHeader>
              <CardContent>
                {queueHealth.isLoading ? (
                  <ListSkeleton rows={3} />
                ) : !health ? (
                  <EmptyState
                    icon={Server}
                    title="Status unavailable"
                    description="Could not reach the queue health endpoint."
                  />
                ) : (
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
                    <ScrollArea className="h-36">
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
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
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
                  {openAlerts.map((a: {
                    id: string;
                    title: string;
                    severity: string;
                    createdAt?: string;
                    matter?: { title: string; matterNumber: string } | null;
                  }) => (
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
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <h3 className="text-lg font-semibold">Welcome to your workspace</h3>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Ask a question, upload a document or research Malaysian law
                    to get started. Everything stays inside your organisation.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    <Button onClick={() => setAskOpen(true)} className="gap-2">
                      <Bot className="size-4" /> Ask a legal question
                    </Button>
                    <Button onClick={() => setUploadOpen(true)} variant="outline" className="gap-2">
                      <Upload className="size-4" /> Analyse a document
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

function AuditActivityCard() {
  const logs = trpcReact.agents.getAuditLogs.useQuery(
    { limit: 8 },
    { staleTime: 30_000 },
  );
  const entries = (logs.data ?? []) as AuditEntry[];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-primary" /> AI activity
            </CardTitle>
            <CardDescription>
              Recent agent actions from the audit trail.
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
            <Link href="/legalai/audit">
              <ArrowUpRight className="size-3" />
              <span className="sr-only">Open audit trail</span>
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.isLoading ? (
          <ListSkeleton rows={5} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No AI activity yet"
            description="Agent actions will appear here as your team uses AI tools."
          />
        ) : (
          <ScrollArea className="h-[280px]">
            <div className="space-y-1">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent/40"
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Bot className="size-3.5 text-muted-foreground" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {entry.action.replace(/_/g, " ")}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.agentName}
                      {entry.durationMs != null &&
                        ` · ${entry.durationMs}ms`}
                      {entry.confidence != null &&
                        ` · ${Math.round(entry.confidence * 100)}% confidence`}
                    </p>
                  </div>
                  <span className="mt-0.5 shrink-0 text-[11px] text-muted-foreground">
                    {entry.createdAt ? relativeTime(entry.createdAt) : ""}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
