"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Filter, X, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { trpcReact } from "@/clients";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

const STATUSES = ["pending", "approved", "rejected", "executed", "cancelled"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  executed: "Executed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  executed: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function HITLPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getParam = (key: string) => searchParams.get(key) ?? undefined;

  const filters = {
    matterId: getParam("matterId") ?? undefined,
    agentName: getParam("agentName") ?? undefined,
    status: getParam("status") ?? undefined,
    limit: 20,
    cursor: getParam("cursor") ?? undefined,
  };

  const { data, isLoading, isError, error, refetch } = trpcReact.hitl.listAll.useQuery({
    matterId: filters.matterId,
    agentName: filters.agentName,
    status: filters.status as (typeof STATUSES)[number] | undefined,
    limit: filters.limit,
    cursor: filters.cursor,
  });
  const stats = trpcReact.hitl.stats.useQuery(undefined, { staleTime: 30_000 });

  const actions = data?.actions ?? [];
  const nextCursor = data?.nextCursor;
  const hasMore = data?.hasMore ?? false;

  const pendingCount = stats.data?.byStatus?.pending ?? 0;
  const pendingApproval = stats.data?.pendingApproval ?? 0;

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    params.delete("cursor");
    router.push(`/lawmate/hitl?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/lawmate/hitl");
  };

  const hasActiveFilters =
    Object.values(filters).some(v => v !== undefined && v !== "" && v !== 20) ||
    searchParams.has("authLevel");

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
    } catch { return "—"; }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Human-in-the-Loop"
          description="Review and approve AI agent actions requiring human authorisation."
          actions={
            <>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
                  <X className="size-3.5" /> Clear filters
                </Button>
              )}
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href="/lawmate/hitl/escalations">Escalations</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href="/lawmate/hitl/history">History</Link>
              </Button>
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">{stats.data?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-amber-600">{pendingApproval}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-green-600">{stats.data?.byStatus?.approved ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-destructive">{stats.data?.byStatus?.rejected ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="size-4" /> Filters
                </CardTitle>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled>
                  Auth-level filter unavailable
                </Button>
                <Select value={filters.status ?? "all"} onValueChange={(v) => updateFilters({ status: v === "all" ? undefined : v })}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search actions..."
                  value={filters.agentName ?? ""}
                  onChange={(e) => updateFilters({ agentName: e.target.value })}
                  className="w-[280px]"
                  aria-label="Search actions"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p role="note" className="mb-4 text-sm text-muted-foreground">
              Auth-level filtering is not supported by this endpoint; results are not filtered by authorization level.
            </p>
            {isLoading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Matter</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : isError ? (
              <div className="text-center py-8 text-destructive">
                <p>Failed to load actions: {error?.message}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Retry</Button>
              </div>
            ) : actions.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="All caught up"
                description="No agent actions match your filters."
              />
            ) : (
              <ScrollArea className="max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Title</TableHead>
                      <TableHead className="w-[140px]">Agent</TableHead>
                      <TableHead className="w-[80px]">Level</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[200px]">Matter</TableHead>
                      <TableHead className="w-[130px]">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actions.map((a: { id: string; title: string; agentName: string; authLevel: number; status: string; matter?: { title: string } | null; createdAt: string }) => (
                      <TableRow key={a.id} className="cursor-pointer hover:bg-accent/40" onClick={() => router.push(`/lawmate/hitl/${a.id}`)}>
                        <TableCell className="font-medium">
                          <div className="truncate">{a.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{a.agentName}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">L{a.authLevel}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn(STATUS_COLORS[a.status])}>{STATUS_LABELS[a.status] ?? a.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="truncate">{a.matter?.title ?? "—"}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
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
    </DashboardShell>
  );
}