"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  Filter,
  Search,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { CreateMatterDialog } from "@/components/lawmate/CreateMatterDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { trpcReact } from "@/clients";
import { useDebounce } from "@/hooks/useDebounce";
import { relativeTime } from "@/lib/lawmate/utils";
import { cn } from "@/lib/utils";

interface MatterRow {
  id: string;
  title: string;
  matterNumber: string;
  status: string;
  priority: string;
  matterType?: string;
  description?: string | null;
  deadlineAt?: string | null;
  updatedAt?: string;
  client?: { id: string; name: string } | null;
  _count?: { agentActions: number; alerts: number };
}

interface MatterDetail extends MatterRow {
  jurisdiction?: string;
  court?: string | null;
  caseNumber?: string | null;
  openedAt?: string;
  riskLevel?: string | null;
  riskScore?: number | null;
  timeline?: Array<{
    id: string;
    title: string;
    eventType: string;
    eventDate: string;
    description?: string | null;
  }>;
  contracts?: Array<{
    id: string;
    title: string;
    status: string;
    expiryDate?: string | null;
  }>;
  alerts?: Array<{
    id: string;
    title: string;
    severity: string;
    createdAt: string;
  }>;
}

interface MatterStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
] as const;

const STATUS_CLASSES: Record<string, string> = {
  open: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  on_hold: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  closed: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

function displayValue(value?: string | null) {
  return value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "—";
}

export default function MattersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [mobileDetail, setMobileDetail] = useState(false);
  const cursor = cursorStack[cursorStack.length - 1];

  const mattersQuery = trpcReact.matters.list.useQuery(
    {
      search: debouncedSearch || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: 25,
      cursor,
    },
    { retry: false },
  );
  const statsQuery = trpcReact.matters.stats.useQuery(undefined, {
    retry: false,
  });
  const matterRows = (mattersQuery.data?.matters ?? []) as MatterRow[];
  const stats = statsQuery.data as MatterStats | undefined;
  const detailQuery = trpcReact.matters.getById.useQuery(selectedId, {
    enabled: !!selectedId,
    retry: false,
  });
  const matter = detailQuery.data as MatterDetail | undefined;

  useEffect(() => {
    if (!matterRows.some((row) => row.id === selectedId)) {
      setSelectedId(matterRows[0]?.id ?? "");
    }
  }, [matterRows, selectedId]);

  const resetCursor = () => setCursorStack([]);
  const setSearchFilter = (value: string) => {
    setSearch(value);
    resetCursor();
  };
  const setStatus = (value: string) => {
    setStatusFilter(value);
    resetCursor();
  };

  const activeCount =
    (stats?.byStatus.open ?? 0) + (stats?.byStatus.active ?? 0);
  const priorityCount = stats?.byPriority ?? {};

  const selectMatter = (id: string) => {
    setSelectedId(id);
    setMobileDetail(true);
  };

  const detailPanel = matter ? (
    <div className="space-y-5 p-4 lg:p-0">
      <div>
        <p className="text-xs text-muted-foreground">Matter</p>
        <h2 className="mt-1 text-lg font-semibold leading-tight">
          {matter.title}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">{matter.matterNumber}</Badge>
          <Badge variant="outline">{displayValue(matter.matterType)}</Badge>
          <Badge
            variant="outline"
            className={STATUS_CLASSES[matter.status] ?? ""}
          >
            {displayValue(matter.status)}
          </Badge>
        </div>
      </div>

      {matter.description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {matter.description}
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Client</dt>
          <dd className="mt-1">{matter.client?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Priority</dt>
          <dd className="mt-1">{displayValue(matter.priority)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Jurisdiction</dt>
          <dd className="mt-1">{matter.jurisdiction ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Last updated</dt>
          <dd className="mt-1">
            {matter.updatedAt ? relativeTime(matter.updatedAt) : "—"}
          </dd>
        </div>
        {matter.deadlineAt ? (
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Deadline</dt>
            <dd className="mt-1">
              {new Date(matter.deadlineAt).toLocaleDateString("en-MY")}
            </dd>
          </div>
        ) : null}
      </dl>

      {matter.alerts?.length ? (
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            Unacknowledged alerts ({matter.alerts.length})
          </h3>
          {matter.alerts.slice(0, 4).map((alert) => (
            <div key={alert.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{alert.title}</span>
                <Badge variant="outline">{displayValue(alert.severity)}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {relativeTime(alert.createdAt)}
              </p>
            </div>
          ))}
        </section>
      ) : (
        <p className="text-xs text-muted-foreground">No unacknowledged alerts.</p>
      )}

      {matter.contracts?.length ? (
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            Related contracts
          </h3>
          {matter.contracts.slice(0, 5).map((contract) => (
            <div
              key={contract.id}
              className="flex items-center justify-between gap-2 rounded-md border p-2 text-xs"
            >
              <span className="truncate font-medium">{contract.title}</span>
              <Badge variant="outline">{displayValue(contract.status)}</Badge>
            </div>
          ))}
        </section>
      ) : null}

      {matter.timeline?.length ? (
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            Recent timeline
          </h3>
          {matter.timeline.slice(0, 5).map((event) => (
            <div key={event.id} className="border-l-2 border-primary/30 pl-3">
              <p className="text-sm font-medium">{event.title}</p>
              <p className="text-xs text-muted-foreground">
                {displayValue(event.eventType)} ·{" "}
                {new Date(event.eventDate).toLocaleDateString("en-MY")}
              </p>
              {event.description ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.description}
                </p>
              ) : null}
            </div>
          ))}
        </section>
      ) : (
        <p className="text-xs text-muted-foreground">No timeline events yet.</p>
      )}
    </div>
  ) : detailQuery.isLoading ? (
    <div className="p-4">
      <ListSkeleton rows={4} />
    </div>
  ) : (
    <div className="p-4 text-sm text-muted-foreground">
      Select a matter to view its persisted details.
    </div>
  );

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Matters</h1>
            <p className="text-sm text-muted-foreground">
              Search and manage matters recorded in your workspace.
            </p>
          </div>
          <CreateMatterDialog />
        </div>

        {(mattersQuery.isError || statsQuery.isError || detailQuery.isError) && (
          <Alert variant="destructive">
            <AlertTitle>Some matter data could not be loaded</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>
                {mattersQuery.error?.message ??
                  statsQuery.error?.message ??
                  detailQuery.error?.message}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void mattersQuery.refetch();
                  void statsQuery.refetch();
                  if (selectedId) void detailQuery.refetch();
                }}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            icon={Briefcase}
            label="Total matters"
            value={stats?.total}
            loading={statsQuery.isLoading}
          />
          <StatCard
            icon={Clock}
            label="Open and active"
            value={activeCount}
            loading={statsQuery.isLoading}
          />
          <StatCard
            icon={AlertTriangle}
            label="Urgent priority"
            value={priorityCount.urgent ?? 0}
            loading={statsQuery.isLoading}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 space-y-3" aria-label="Matter list">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={search}
                  onChange={(event) => setSearchFilter(event.target.value)}
                  placeholder="Search matters…"
                  aria-label="Search matters"
                  className="h-9 pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Filter by status">
                  <Filter className="size-3.5" aria-hidden />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mattersQuery.isError ? null : mattersQuery.isLoading ? (
              <ListSkeleton rows={5} />
            ) : matterRows.length ? (
              <div className="space-y-2">
                {matterRows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => selectMatter(row.id)}
                    aria-pressed={selectedId === row.id}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors hover:bg-accent/40",
                      selectedId === row.id && "border-primary/50 bg-primary/5",
                    )}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Briefcase className="size-4 text-muted-foreground" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold leading-tight">
                          {row.title}
                        </span>
                        <Badge variant="secondary">{row.matterNumber}</Badge>
                        <Badge
                          variant="outline"
                          className={STATUS_CLASSES[row.status] ?? ""}
                        >
                          {displayValue(row.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3" aria-hidden />
                          {row.client?.name ?? "No client name"}
                        </span>
                        <span> · {displayValue(row.matterType)}</span>
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {row.deadlineAt ? (
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="size-3" aria-hidden />
                            Due {new Date(row.deadlineAt).toLocaleDateString("en-MY")}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                          <FileCheck className="size-3" aria-hidden />
                          {row._count?.agentActions ?? 0} agent actions
                        </span>
                        <span className="ml-auto">
                          {row.updatedAt ? relativeTime(row.updatedAt) : "—"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className="mt-2 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </button>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="mx-auto mb-3 size-8 text-muted-foreground opacity-40" />
                  <h2 className="font-medium">
                    {search || statusFilter !== "all"
                      ? "No matching matters"
                      : "No matters recorded"}
                  </h2>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    {search || statusFilter !== "all"
                      ? "Change the search or status filter to see other matters."
                      : "Create a matter linked to an existing client to start organizing its work."}
                  </p>
                  {!search && statusFilter === "all" ? (
                    <div className="mt-4">
                      <CreateMatterDialog />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {cursorStack.length > 0 || mattersQuery.data?.hasMore ? (
              <div className="flex items-center justify-between border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!cursorStack.length || mattersQuery.isFetching}
                  onClick={() => setCursorStack((current) => current.slice(0, -1))}
                >
                  <ChevronLeft className="mr-1 size-4" aria-hidden />
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {cursorStack.length + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={mattersQuery.isFetching || !mattersQuery.data?.hasMore}
                  onClick={() => {
                    const nextCursor = mattersQuery.data?.nextCursor;
                    if (nextCursor) {
                      setCursorStack((current) => [...current, nextCursor]);
                    }
                  }}
                >
                  Next
                  <ChevronRight className="ml-1 size-4" aria-hidden />
                </Button>
              </div>
            ) : null}
          </section>

          <Card className="hidden self-start lg:sticky lg:top-20 lg:block">
            <CardContent className="p-4">
              {detailQuery.isError ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not load matter details</AlertTitle>
                  <AlertDescription>{detailQuery.error.message}</AlertDescription>
                </Alert>
              ) : (
                detailPanel
              )}
            </CardContent>
          </Card>

          <Drawer open={mobileDetail} onOpenChange={setMobileDetail}>
            <DrawerContent className="max-h-[85vh] overflow-y-auto p-4">
              {detailQuery.isError ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not load matter details</AlertTitle>
                  <AlertDescription>{detailQuery.error.message}</AlertDescription>
                </Alert>
              ) : (
                detailPanel
              )}
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </DashboardShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof Briefcase;
  label: string;
  value?: number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="size-4" aria-hidden />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">
            {loading ? "…" : (value ?? "—")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
