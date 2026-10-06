"use client";
import * as React from "react";
import type { HITLFilters, HITLRequest, HITLSort, HITLStats } from "../types";
import { trpcReact } from "@/clients";

export interface UseHITLQueueOptions {
  filters?: HITLFilters;
  sort?: HITLSort;
  scope?: "inbox" | "assigned" | "team" | "escalations" | "history" | "all";
  currentUserId?: string;
  currentTeam?: string;
}

export interface UseHITLQueueResult {
  requests: HITLRequest[];
  stats: HITLStats | null;
  loading: boolean;
  error?: string;
  reload: () => void;
}

export function useHITLQueue(options: UseHITLQueueOptions = {}): UseHITLQueueResult {
  const { filters, sort, scope = "all", currentUserId, currentTeam } = options;
  const [requests, setRequests] = React.useState<HITLRequest[]>([]);
  const [stats, setStats] = React.useState<HITLStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const [tick, setTick] = React.useState(0);

  const reload = React.useCallback(() => setTick((t) => t + 1), []);

  const isHistory = scope === "history";
  const isEscalations = scope === "escalations";

  const queryInput = {
    orgId: undefined,
    matterId: undefined,
    agentName: filters?.domain?.[0],
    authLevel: isEscalations ? 3 : undefined,
    status: isHistory ? undefined : (filters?.status?.[0] as any),
    limit: 20,
  };

  const { data: actionsData, isLoading: actionsLoading, error: actionsError } = trpcReact.hitl.listAll.useQuery(
    isHistory ? { ...queryInput, status: undefined } : queryInput,
    { staleTime: 30_000 }
  );

  const { data: statsData, isLoading: statsLoading } = trpcReact.hitl.stats.useQuery(undefined, { staleTime: 30_000 });

  React.useEffect(() => {
    if (actionsLoading || statsLoading) {
      setLoading(true);
      return;
    }

    if (actionsError) {
      setError(actionsError.message);
      setLoading(false);
      return;
    }

    const mappedRequests: HITLRequest[] = (actionsData?.actions ?? []).map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      status: a.status as HITLRequest["status"],
      kind: a.actionType.toLowerCase() as HITLRequest["kind"],
      priority: a.authLevel >= 3 ? "high" : "normal",
      source: { domain: a.agentName },
      createdAt: a.createdAt,
      sla: { dueAt: a.expiresAt },
      assigneeTeam: a.matter?.title,
    }));

    const mappedStats: HITLStats = {
      total: statsData?.total ?? 0,
      pending: statsData?.byStatus?.pending ?? 0,
      inReview: statsData?.pendingApproval ?? 0,
      escalated: isEscalations ? mappedRequests.length : 0,
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
  }, [actionsData, actionsLoading, actionsError, statsData, statsLoading, scope, tick]);

  return { requests, stats, loading, error, reload };
}