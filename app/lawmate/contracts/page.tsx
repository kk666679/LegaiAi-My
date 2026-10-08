"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Upload, Filter, X, FileCheck, Search, Users, Calendar, ScrollText, BookOpen, FileText, ShieldAlert, BarChart3 } from "lucide-react";
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
import { CreateContractDialog } from "@/components/lawmate/CreateContractDialog";
import { cn } from "@/lib/utils";
import Link from "next/link";

const CONTRACT_STATUS = ["draft", "review", "negotiation", "executed", "expired", "terminated"] as const;
const CONTRACT_TYPE = ["NDA", "SERVICE", "EMPLOYMENT", "LEASE", "SALE", "LOAN", "PARTNERSHIP", "OTHER"] as const;

type ContractStatus = typeof CONTRACT_STATUS[number];
type ContractType = typeof CONTRACT_TYPE[number];

const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Draft",
  review: "Review",
  negotiation: "Negotiation",
  executed: "Executed",
  expired: "Expired",
  terminated: "Terminated",
};

const STATUS_COLORS: Record<ContractStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  review: "bg-blue-100 text-blue-700",
  negotiation: "bg-amber-100 text-amber-700",
  executed: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-700",
  terminated: "bg-gray-100 text-gray-500",
};

type ContractRow = {
  id: string;
  title: string;
  client?: { name?: string | null } | null;
  contractType: string;
  status: ContractStatus | string;
  counterparty?: string | null;
  expiryDate?: string | null;
};

export default function ContractsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = React.useState(false);

  const getParam = (key: string) => searchParams.get(key) ?? undefined;

  const filters = {
    status: getParam("status") as ContractStatus | undefined,
    contractType: getParam("contractType") as ContractType | undefined,
    clientId: getParam("clientId") ?? undefined,
    matterId: getParam("matterId") ?? undefined,
    search: getParam("search") ?? undefined,
    limit: 20,
    cursor: getParam("cursor") ?? undefined,
  };

  const { data, isLoading, isError, error, refetch } = trpcReact.contracts.list.useQuery(filters);
  const stats = trpcReact.contracts.stats.useQuery(undefined, { staleTime: 30_000 });
  const expiring = trpcReact.contracts.getExpiringContracts.useQuery({ withinDays: 90 }, { staleTime: 60_000 });

  const contracts: ContractRow[] = data?.contracts ?? [];
  const nextCursor = data?.nextCursor;
  const hasMore = data?.hasMore ?? false;

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
    router.push(`/lawmate/contracts?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/lawmate/contracts");
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== "" && v !== 20);

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
    } catch { return "—"; }
  };

  const handleCreateContract = async (data: { clientId?: string; matterId?: string; title: string; contractType: string; counterparty?: string; value?: number; currency?: string; effectiveDate?: string; expiryDate?: string; autoRenew?: boolean; renewalNoticeDays?: number; content?: string }) => {
    try {
      await trpcReact.contracts.create.mutateAsync(data);
      refetch();
      setCreateOpen(false);
    } catch (err) {
      console.error("Failed to create contract:", err);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Contracts"
          description="Manage contracts across their full lifecycle."
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
                <Plus className="size-3.5" /> New contract
              </Button>
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">{stats.data?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Executed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-green-600">{stats.data?.byStatus?.executed ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-blue-600">{stats.data?.byStatus?.review ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expiring (90 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-amber-600">{expiring.data?.length ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="size-4" /> Quick Navigation
            </CardTitle>
            <CardDescription>Jump to common contract views and tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/lawmate/contracts/new">
                  <div className="flex items-center gap-2">
                    <Plus className="size-5 text-primary" />
                    <div>
                      <p className="font-medium">New contract</p>
                      <p className="text-xs text-muted-foreground">Create contract</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/lawmate/contracts/counterparties">
                  <div className="flex items-center gap-2">
                    <Users className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Counterparties</p>
                      <p className="text-xs text-muted-foreground">Manage parties</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/lawmate/contracts/renewals">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-5 text-amber-500" />
                    <div>
                      <p className="font-medium">Renewals</p>
                      <p className="text-xs text-muted-foreground">Upcoming renewals</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/lawmate/contracts/playbooks">
                  <div className="flex items-center gap-2">
                    <ScrollText className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Playbooks</p>
                      <p className="text-xs text-muted-foreground">Negotiation guides</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/lawmate/contracts/templates">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-5 text-primary" />
                    <div>
                      <p className="font-medium">Templates</p>
                      <p className="text-xs text-muted-foreground">Contract templates</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/lawmate/contracts/clauses">
                  <div className="flex items-center gap-2">
                    <FileText className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Clause Library</p>
                      <p className="text-xs text-muted-foreground">Reusable clauses</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/lawmate/contracts/approvals">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-5 text-amber-500" />
                    <div>
                      <p className="font-medium">Approvals</p>
                      <p className="text-xs text-muted-foreground">Pending approvals</p>
                    </div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-3 gap-2 justify-start">
                <Link href="/lawmate/contracts/analytics">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Analytics</p>
                      <p className="text-xs text-muted-foreground">Contract insights</p>
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
                <Select value={filters.status ?? "all"} onValueChange={(v) => updateFilters({ status: v === "all" ? undefined : v as ContractStatus })}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {CONTRACT_STATUS.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.contractType ?? "all"} onValueChange={(v) => updateFilters({ contractType: v === "all" ? undefined : v as ContractType })}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="All types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {CONTRACT_TYPE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search contracts..."
                  value={filters.search ?? ""}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="w-[280px]"
                  aria-label="Search contracts"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>Expiry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : isError ? (
              <div className="text-center py-8 text-destructive">
                <p>Failed to load contracts: {error?.message}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Retry</Button>
              </div>
            ) : contracts.length === 0 ? (
              <EmptyState
                icon={FileCheck}
                title="No contracts found"
                description="Create your first contract to start tracking obligations, renewals and risks."
                action="Create contract"
                actionHref="/lawmate/contracts/new"
              />
            ) : (
              <ScrollArea className="max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[280px]">Contract</TableHead>
                      <TableHead className="w-[180px]">Client</TableHead>
                      <TableHead className="w-[130px]">Type</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[180px]">Counterparty</TableHead>
                      <TableHead className="w-[130px]">Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((c: ContractRow) => (
                      <TableRow key={c.id} className="cursor-pointer hover:bg-accent/40" onClick={() => router.push(`/lawmate/contracts/${c.id}/overview`)}>
                        <TableCell className="font-medium">
                          <div className="truncate">{c.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="truncate">{c.client?.name ?? "—"}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{c.contractType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(STATUS_COLORS[c.status as ContractStatus])}>
                            {STATUS_LABELS[c.status as ContractStatus] ?? c.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="truncate">{c.counterparty ?? "—"}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(c.expiryDate)}</TableCell>
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

      <CreateContractDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreateContract} />
    </DashboardShell>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "—"; }
}