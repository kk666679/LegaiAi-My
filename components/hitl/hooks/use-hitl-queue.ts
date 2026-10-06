"use client";
import * as React from "react";
import type { HITLFilters, HITLRequest, HITLSort, HITLStats } from "../types";
import { trpcReact, type RouterOutputs } from "@/clients";

type HITLActionStatus = "pending" | "approved" | "rejected" | "executed" | "cancelled";
type HITLListAction = RouterOutputs["hitl"]["listAll"]["actions"][number];
type HITLPendingAction = RouterOutputs["hitl"]["listPending"][number];
type HITLAction = HITLListAction | HITLPendingAction;

const HISTORY_STATUSES: HITLActionStatus[] = ["approved", "rejected", "executed", "cancelled"];
const ACTION_STATUSES: HITLActionStatus[] = ["pending", ...HISTORY_STATUSES];

export interface UseHITLQueueOptions {
  filters?: HITLFilters;
  sort?: HITLSort;
  scope?: "inbox" | "assigned" | "team" | "escalations" | "history" | "all";
}

export interface UseHITLQueueResult {
  requests: HITLRequest[];
  stats: HITLStats | null;
  loading: boolean;
  error?: string;
  reload: () => void;
}

function isActionStatus(status: string | undefined): status is HITLActionStatus {
  return status !== undefined && ACTION_STATUSES.includes(status as HITLActionStatus);
}

function mapAction(action: HITLAction): HITLRequest {
  const startedAt = new Date(action.createdAt);
  const dueAt = action.expiresAt ? new Date(action.expiresAt) : undefined;

  return {
    id: action.id,
    title: action.title,
    description: action.description,
    status: action.status as HITLRequest["status"],
    kind: action.actionType.toLowerCase() as HITLRequest["kind"],
    priority: action.authLevel >= 3 ? "high" : "normal",
    source: { domain: action.agentName },
    createdAt: startedAt.toISOString(),
    updatedAt: new Date(action.updatedAt).toISOString(),
    ...(dueAt
      ? {
          sla: {
            hoursAllowed: Math.max(0, (dueAt.getTime() - startedAt.getTime()) / 3_600_000),
            startedAt: startedAt.toISOString(),
            dueAt: dueAt.toISOString(),
            breached: dueAt.getTime() < Date.now(),
          },
        }
      : {}),
  };
}

export function useHITLQueue(options: UseHITLQueueOptions = {}): UseHITLQueueResult {
  const { filters, scope = "all" } = options;
  const [requests, setRequests] = React.useState<HITLRequest[]>([]);
  const [stats, setStats] = React.useState<HITLStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();

  const isHistory = scope === "history";
  const isEscalations = scope === "escalations";
  const requestedStatus = filters?.status?.[0];
  const domainFilter = filters?.domain?.[0];
  const selectedStatus = isActionStatus(requestedStatus) ? requestedStatus : undefined;
  const historyStatus =
    selectedStatus && HISTORY_STATUSES.includes(selectedStatus) ? selectedStatus : undefined;
  const emptyHistoryFilter = isHistory && selectedStatus === "pending";
  const defaultPendingScope = scope === "inbox" || scope === "assigned" || scope === "team";
  const queryStatus = selectedStatus ?? (defaultPendingScope ? "pending" : undefined);

  const queueQuery = trpcReact.hitl.listAll.useQuery(
    {
      ...(queryStatus ? { status: queryStatus } : {}),
      ...(domainFilter ? { agentName: domainFilter } : {}),
      limit: 20,
    },
    { enabled: !isEscalations && (!isHistory || !!historyStatus), staleTime: 30_000 }
  );
  const escalationQuery = trpcReact.hitl.listPending.useQuery(
    { limit: 20 },
    { enabled: isEscalations, staleTime: 30_000 }
  );
  const historyQueryOptions = { enabled: isHistory && !historyStatus && !emptyHistoryFilter, staleTime: 30_000 };
  const approvedHistoryQuery = trpcReact.hitl.listAll.useQuery(
    { status: "approved", limit: 20 },
    historyQueryOptions
  );
  const rejectedHistoryQuery = trpcReact.hitl.listAll.useQuery(
    { status: "rejected", limit: 20 },
    historyQueryOptions
  );
  const executedHistoryQuery = trpcReact.hitl.listAll.useQuery(
    { status: "executed", limit: 20 },
    historyQueryOptions
  );
  const cancelledHistoryQuery = trpcReact.hitl.listAll.useQuery(
    { status: "cancelled", limit: 20 },
    historyQueryOptions
  );
  const historyQueries = [
    approvedHistoryQuery,
    rejectedHistoryQuery,
    executedHistoryQuery,
    cancelledHistoryQuery,
  ];
  const statsQuery = trpcReact.hitl.stats.useQuery(undefined, { staleTime: 30_000 });

  const historyActions = React.useMemo(() => {
    return historyQueries
      .flatMap((query) =>
        (query.data?.actions ?? []).filter((action: HITLAction) =>
          !domainFilter || action.agentName === domainFilter
        )
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }, [
    approvedHistoryQuery.data,
    rejectedHistoryQuery.data,
    executedHistoryQuery.data,
    cancelledHistoryQuery.data,
    domainFilter,
  ]);
  const actions = isEscalations
    ? escalationQuery.data ?? []
    : emptyHistoryFilter
      ? []
    : isHistory && !historyStatus
      ? historyActions
      : queueQuery.data?.actions ?? [];
  const actionsLoading = isEscalations
    ? escalationQuery.isLoading
    : emptyHistoryFilter
      ? false
    : isHistory && !historyStatus
      ? historyQueries.some((query) => query.isLoading)
      : queueQuery.isLoading;
  const actionsError = isEscalations
    ? escalationQuery.error
    : emptyHistoryFilter
      ? undefined
    : isHistory && !historyStatus
      ? historyQueries.find((query) => query.error)?.error
      : queueQuery.error;
  const queryError = actionsError ?? statsQuery.error;
  const statsData = statsQuery.data;
  const statsLoading = statsQuery.isLoading;

  const reload = React.useCallback(() => {
    const activeQueryRefetches = isEscalations
      ? [escalationQuery.refetch()]
      : isHistory && !historyStatus
        ? [
            approvedHistoryQuery.refetch(),
            rejectedHistoryQuery.refetch(),
            executedHistoryQuery.refetch(),
            cancelledHistoryQuery.refetch(),
          ]
        : [queueQuery.refetch()];
    void Promise.all([...activeQueryRefetches, statsQuery.refetch()]);
  }, [
    approvedHistoryQuery.refetch,
    cancelledHistoryQuery.refetch,
    escalationQuery.refetch,
    executedHistoryQuery.refetch,
    historyStatus,
    isEscalations,
    isHistory,
    queueQuery.refetch,
    rejectedHistoryQuery.refetch,
    statsQuery.refetch,
  ]);

  React.useEffect(() => {
    if (actionsLoading || statsLoading) {
      setLoading(true);
      return;
    }

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    const mappedRequests = actions.map(mapAction);

    const mappedStats: HITLStats = {
      total: statsData?.total ?? 0,
      pending: statsData?.byStatus?.pending ?? 0,
      inReview: statsData?.pendingApproval ?? 0,
      escalated: 0,
      breachedSLAs: 0,
      approvedToday: 0,
      rejectedToday: 0,
      avgDecisionMinutes: 0,
      autoApprovalRate: 0,
    };

    setRequests(mappedRequests);
    setStats(mappedStats);
    setLoading(false);
    setError(undefined);
  }, [actions, actionsLoading, queryError, statsData, statsLoading]);

  return { requests, stats, loading, error, reload };
}