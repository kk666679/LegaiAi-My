"use client";

import * as React from "react";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Upload, Filter, X, Clock, Star, CalendarClock, ShieldAlert, BarChart3, Briefcase, PauseCircle, CheckCircle2, Archive } from "lucide-react";
import { trpcReact } from "@/clients";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/EmptyState";
import { CreateMatterDialog } from "@/components/lawmate/CreateMatterDialog";
import { cn } from "@/lib/utils";
import Link from "next/link";

const MATTER_STATUS = ["open", "active", "on_hold", "closed", "archived"] as const;
const MATTER_TYPE = [
  "LITIGATION", "CONTRACT", "ADVISORY", "COMPLIANCE",
  "CONVEYANCING", "CORPORATE", "CRIMINAL", "FAMILY", "EMPLOYMENT", "IP"
] as const;
const PRIORITY = ["low", "medium", "high", "urgent"] as const;

type Status = typeof MATTER_STATUS[number];
type MatterType = typeof MATTER_TYPE[number];
type Priority = typeof PRIORITY[number];

const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  active: "Active",
  on_hold: "On Hold",
  closed: "Closed",
  archived: "Archived",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

export default function MattersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  const getParam = (key: string) => searchParams.get(key) ?? undefined;
  const getParamArray = (key: string) => searchParams.getAll(key);

  const filters = {
    status: getParam("status") as Status | undefined,
    matterType: getParam("matterType") as MatterType | undefined,
    priority: getParam("priority") as Priority | undefined,
    assignedTo: getParam("assignedTo") ?? undefined,
    search: getParam("search") ?? undefined,
    limit: 20,
    cursor: getParam("cursor") ?? undefined,
  };

  const { data, isLoading, isError, error, refetch } = trpcReact.matters.list.useQuery(filters);

  const stats = trpcReact.matters.stats.useQuery(undefined, { staleTime: 30_000 });
  const attention = trpcReact.matters.getAttentionRequired.useQuery(undefined, { staleTime: 30_000 });

  const matters = data?.matters ?? [];
  const nextCursor = data?.nextCursor;
  const hasMore = data?.hasMore ?? false;

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.delete(key);
        value.forEach(v => params.append(key, v));
      } else {
        params.set(key, String(value));
      }
    });
    params.delete("cursor");
    router.push(`/legalai/matters?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/legalai/matters");
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== "" && v !== 20);

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
    } catch { return "—"; }
  };

  const handleCreateMatter = async (data: { clientId: string; title: string; matterType: string; priority: string; jurisdiction: string; court?: string; caseNumber?: string; description?: string; assignedTo?: string; deadlineAt?: string }) => {
    try {
      await trpcReact.matters.create.mutateAsync(data);
      refetch();
      setCreateOpen(false);
    } catch (err) {
      console.error("Failed to create matter:", err);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Matters"
          description="Manage client engagements across their full lifecycle."
          actions={
            <>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
                  <X className="size-3.5" /> Clear filters
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-1.5">
                <Upload className="size-3.5" /> Import
              </Button>
              <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
                <Plus className="size-3.5" /> New matter
              </Button>
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Matters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">{stats.data?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">
                {(stats.data?.byStatus?.open ?? 0) + (stats.data?.byStatus?.active ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-destructive">
                {(stats.data?.byPriority?.high ?? 0) + (stats.data?.byPriority?.urgent ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Deadlines (8 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-amber-600">
                {attention.data?.deadlineSoon.length ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="size-4" /> Quick Navigation
            </CardTitle>
            <CardDescription>Jump to common matter views and tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/matters/new">
                  <div className="flex items-center gap-2">
                    <Plus className="size-5 text-primary" />
                    <div>
                      <p className="font-medium">New matter</p>
                      <p className="text-xs text-muted-foreground">Create matter</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/matters/recent">
                  <div className="flex items-center gap-2">
                    <Clock className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Recent</p>
                      <p className="text-xs text-muted-foreground">Recently updated</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/matters/favorites">
                  <div className="flex items-center gap-2">
                    <Star className="size-5 text-amber-500" />
                    <div>
                      <p className="font-medium">Favorites</p>
                      <p className="text-xs text-muted-foreground">Starred matters</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/matters?status=open">
                  <div className="flex items-center gap-2">
                    <Briefcase className="size-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Open</p>
                      <p className="text-xs text-muted-foreground">Active engagements</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/matters?status=on_hold">
                  <div className="flex items-center gap-2">
                    <PauseCircle className="size-5 text-amber-500" />
                    <div>
                      <p className="font-medium">On hold</p>
                      <p className="text-xs text-muted-foreground">Paused matters</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/matters/closed">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-green-500" />
                    <div>
                      <p className="font-medium">Closed</p>
                      <p className="text-xs text-muted-foreground">Completed matters</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/matters/deadlines">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="size-5 text-amber-500" />
                    <div>
                      <p className="font-medium">Deadlines</p>
                      <p className="text-xs text-muted-foreground">Upcoming deadlines</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/matters/conflicts">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-5 text-destructive" />
                    <div>
                      <p className="font-medium">Conflicts</p>
                      <p className="text-xs text-muted-foreground">Conflict checks</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/matters/analytics">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Analytics</p>
                      <p className="text-xs text-muted-foreground">Matter insights</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/legalai/matters?status=archived">
                  <div className="flex items-center gap-2">
                    <Archive className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Archived</p>
                      <p className="text-xs text-muted-foreground">Stored matters</p>
                    </div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="size-4" /> Filters
                </CardTitle>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={filters.status ?? "all"} onValueChange={(v) => updateFilters({ status: v === "all" ? undefined : v as Status })}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {MATTER_STATUS.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.matterType ?? "all"} onValueChange={(v) => updateFilters({ matterType: v === "all" ? undefined : v as MatterType })}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="All types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {MATTER_TYPE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.priority ?? "all"} onValueChange={(v) => updateFilters({ priority: v === "all" ? undefined : v as Priority })}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="All priorities" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    {PRIORITY.map(p => <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search matters..."
                  value={filters.search ?? ""}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="w-[280px]"
                  aria-label="Search matters"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matter</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[70px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : isError ? (
              <div className="text-center py-8 text-destructive">
                <p>Failed to load matters: {error?.message}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Retry</Button>
              </div>
            ) : matters.length === 0 ? (
              <EmptyState
                icon={Plus}
                title="No matters found"
                description="Create your first matter to start tracking cases, documents and AI activity."
                action="Create matter"
                actionHref="/legalai/matters/new"
              />
            ) : (
              <ScrollArea className="max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Matter</TableHead>
                      <TableHead className="w-[200px]">Client</TableHead>
                      <TableHead className="w-[150px]">Type</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[100px]">Priority</TableHead>
                      <TableHead className="w-[130px]">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matters.map((m: { id: string; title: string; matterNumber: string; client?: { name: string } | null; matterType: string; status: string; priority: string; updatedAt: string }) => (
                      <TableRow key={m.id} className="cursor-pointer hover:bg-accent/40" onClick={() => router.push(`/legalai/matters/${m.id}/overview`)}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="truncate">{m.title}</div>
                            <div className="text-xs text-muted-foreground">{m.matterNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="truncate">{m.client?.name ?? "—"}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{m.matterType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{STATUS_LABELS[m.status as Status] ?? m.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn(PRIORITY_COLORS[m.priority as Priority], "text-xs")}>
                            {PRIORITY_LABELS[m.priority as Priority] ?? m.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(m.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            {hasMore && nextCursor && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ cursor: nextCursor })}
                  disabled={isLoading}
                >
                  Load more
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateMatterDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreateMatter} />
    </DashboardShell>
  );
}