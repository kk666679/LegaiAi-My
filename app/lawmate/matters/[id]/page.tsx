"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpcReact } from "@/clients";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { formatDate } from "@/lib/lawmate/utils";
import { cn } from "@/lib/utils";
import { Briefcase, FileText, Activity, BarChart3, AlertTriangle, CalendarClock, Gavel, Users, File, Search } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  active: "Active",
  on_hold: "On Hold",
  closed: "Closed",
  archived: "Archived",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

const TABS = [
  { id: "overview", label: "Overview", icon: Briefcase },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
] as const;

export default function MatterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = React.useState("overview");

  const matter = trpcReact.matters.getById.useQuery(id, { staleTime: 30_000 });
  const timeline = trpcReact.matters.getTimeline.useQuery({ matterId: id }, { staleTime: 30_000 });
  const alerts = trpcReact.matters.getAlerts.useQuery({ matterId: id, limit: 20 }, { staleTime: 30_000 });
  const riskScores = trpcReact.matters.getRiskScores.useQuery({ matterId: id }, { staleTime: 30_000 });
  const stats = trpcReact.matters.stats.useQuery(undefined, { staleTime: 60_000 });
  const attention = trpcReact.matters.getAttentionRequired.useQuery(undefined, { staleTime: 30_000 });
  const updateMatter = trpcReact.matters.update.useMutation();

  const documents = trpcReact.documents.list.useQuery(
    { clientId: matter.data?.clientId, limit: 20 },
    { enabled: !!matter.data?.clientId, staleTime: 30_000 }
  );

  const loading = matter.isLoading;
  const failed = matter.isError;

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6 p-4 lg:p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent><Skeleton className="h-12 w-full" /></CardContent></Card>
            ))}
          </div>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {TABS.map(t => <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>)}
            </TabsList>
            <TabsContent value="overview"><div className="p-4 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div></TabsContent>
          </Tabs>
        </div>
      </DashboardShell>
    );
  }

  if (failed || !matter.data) {
    return (
      <DashboardShell>
        <div className="space-y-6 p-4 lg:p-6">
          <div className="text-center py-12">
            <AlertTriangle className="size-12 mx-auto text-destructive" />
            <h2 className="mt-4 text-xl font-semibold">Matter not found</h2>
            <p className="mt-2 text-muted-foreground">The matter you're looking for doesn't exist or you don't have access.</p>
            <Button asChild className="mt-4"><Link href="/lawmate/matters">Back to matters</Link></Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const m = matter.data;

  const handleStatusChange = async (status: string) => {
    try {
      await updateMatter.mutateAsync({ id, status: status as any });
      void matter.refetch();
    } catch (err) {
      console.error("Failed to update matter:", err);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title={m.title}
          description={
            <>
              <span className="mr-2">{m.matterNumber}</span>
              {m.client && (
                <>
                  <span className="mx-2">·</span>
                  <span className="text-primary">
                    {m.client.name}
                  </span>
                </>
              )}
            </>
          }
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => handleStatusChange("closed")}>
                Close matter
              </Button>
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">{STATUS_LABELS[m.status] ?? m.status}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className={cn(PRIORITY_COLORS[m.priority])}>
                {PRIORITY_LABELS[m.priority] ?? m.priority}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{m.matterType}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Opened</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-muted-foreground">{formatDate(m.openedAt)}</span>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="gap-2">
                <t.icon className="size-3.5" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="size-4" /> Matter Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {m.description && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                      <p className="mt-1 text-sm">{m.description}</p>
                    </div>
                  )}
                  <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                    <div><dt className="text-muted-foreground">Jurisdiction</dt><dd>{m.jurisdiction ?? "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Court</dt><dd>{m.court ?? "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Case Number</dt><dd>{m.caseNumber ?? "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Assigned To</dt><dd>{m.assignedTo ?? "Unassigned"}</dd></div>
                    <div><dt className="text-muted-foreground">Deadline</dt><dd>{formatDate(m.deadlineAt)}</dd></div>
                    <div><dt className="text-muted-foreground">Last Activity</dt><dd>{formatDate(m.lastActivityAt)}</dd></div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-destructive" /> Open Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts.isLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : alerts.data && alerts.data.length > 0 ? (
                    <div className="space-y-2">
                      {alerts.data.map((a: { id: string; title: string; description?: string | null; severity: string }) => (
                        <div key={a.id} className="p-3 rounded-md border bg-card/40">
                          <p className="font-medium text-sm">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.description ?? ""}</p>
                          <Badge variant="outline" className="mt-1">{a.severity}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No open alerts</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="size-4 text-amber-600" /> Upcoming Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {attention.isLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : !attention.data?.deadlineSoon.length ? (
                    <p className="text-sm text-muted-foreground">No imminent deadlines</p>
                  ) : (
                    <div className="space-y-2">
                      {attention.data.deadlineSoon.slice(0, 5).map((d: { id: string; title: string; client?: { name: string } | null; deadlineAt: string }) => (
                        <div key={d.id} className="p-3 rounded-md border bg-card/40">
                          <p className="font-medium text-sm">{d.title}</p>
                          <p className="text-xs text-muted-foreground">{d.client?.name}</p>
                          <p className="text-xs text-amber-600 font-medium">{formatDate(d.deadlineAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-4" /> Risk Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {riskScores.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : riskScores.data && riskScores.data.length > 0 ? (
                  <div className="space-y-2">
                    {riskScores.data.map((r: { id: string; riskType: string; reasoning: string; level: string; score: number }) => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-md border bg-card/40">
                        <div>
                          <p className="font-medium text-sm">{r.riskType}</p>
                          <p className="text-xs text-muted-foreground">{r.reasoning}</p>
                        </div>
                        <Badge variant={r.level === "critical" ? "destructive" : r.level === "high" ? "secondary" : "outline"}>
                          {r.level} ({Math.round(r.score * 100)}%)
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No risk scores available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-4" /> Related Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : documents.data?.documents.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No documents"
                    description="Documents linked to this matter's client will appear here."
                  />
                ) : (
                  <div className="space-y-2">
                    {documents.data?.documents.map((d: { id: string; title: string; docType: string; version: number; updatedAt: string; status: string }) => (
                      <Link
                        key={d.id}
                        href={`/lawmate/documents/${d.id}/preview`}
                        className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent/40"
                      >
                        <FileText className="size-5 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{d.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.docType} · v{d.version} · {formatDate(d.updatedAt)}
                          </p>
                        </div>
                        <Badge variant="outline">{d.status}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-4" /> Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : timeline.data && timeline.data.length > 0 ? (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-4">
                      {timeline.data.map((e: { id: string; title: string; description?: string | null; eventDate: string }) => (
                        <div key={e.id} className="flex gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Gavel className="size-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{e.title}</p>
                            <p className="text-xs text-muted-foreground">{e.description ?? ""}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(e.eventDate)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">No activity recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-4" /> Matter Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : stats.data ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total" value={stats.data.total} icon={Briefcase} />
                    <StatCard label="Open" value={stats.data.byStatus?.open ?? 0} icon={FolderOpen} />
                    <StatCard label="Active" value={stats.data.byStatus?.active ?? 0} icon={Activity} />
                    <StatCard label="Closed" value={stats.data.byStatus?.closed ?? 0} icon={CheckCircle} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No statistics available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md bg-primary/10 p-2 text-primary"><Icon className="size-4" /></div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FolderOpen({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
}

function CheckCircle({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}