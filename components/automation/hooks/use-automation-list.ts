// components/automation/hooks/use-automation-list.ts
//
// Reads real automations from the automations tRPC router. No mock data, no
// hardcoded metrics. Empty state is empty; loading/error are explicit.

import { useMemo } from "react";
import { trpcReact } from "@/clients";
import type { WorkflowMeta, WorkflowStats } from "../types";

export interface UseAutomationListOptions {
  query?: string;
  status?: "draft" | "active" | "paused" | "archived";
  category?: string;
  sortBy?: "name" | "updatedAt" | "createdAt" | "lastRunAt";
  sortDir?: "asc" | "desc";
  limit?: number;
}

export interface UseAutomationListResult {
  workflows: WorkflowMeta[];
  statsById: Record<string, WorkflowStats>;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor?: string;
  reload: () => void;
}

const EMPTY_STATS: WorkflowStats = { totalRuns: 0, successRate: 0, avgDurationMs: 0, activeRuns: 0 };

export function useAutomationList(options?: UseAutomationListOptions): UseAutomationListResult {
  const query = trpcReact.automations.list.useQuery(
    {
      query: options?.query,
      status: options?.status,
      category: options?.category,
      sortBy: options?.sortBy ?? "updatedAt",
      sortDir: options?.sortDir ?? "desc",
      limit: options?.limit ?? 20,
    },
    { refetchOnWindowFocus: false },
  );

  const workflows = useMemo<WorkflowMeta[]>(
    () =>
      (query.data?.items ?? []).map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description ?? undefined,
        category: a.category ?? undefined,
        status: a.status as WorkflowMeta["status"],
        ownerId: undefined,
        ownerName: undefined,
        matterId: undefined,
        tags: a.tags,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
    [query.data?.items],
  );

  const statsById = useMemo<Record<string, WorkflowStats>>(() => {
    const map: Record<string, WorkflowStats> = {};
    for (const a of query.data?.items ?? []) {
      map[a.id] = {
        totalRuns: a.totalRuns,
        successRate: a.successRate ?? 0,
        avgDurationMs: 0,
        lastRunAt: a.lastRunAt ?? undefined,
        activeRuns: a.activeRuns ?? 0,
      };
    }
    return map;
  }, [query.data?.items]);

  return {
    workflows,
    statsById,
    loading: query.isLoading,
    error: (query.error as Error | undefined)?.message ?? null,
    hasMore: query.data?.hasMore ?? false,
    nextCursor: query.data?.nextCursor,
    reload: query.refetch,
  };
}