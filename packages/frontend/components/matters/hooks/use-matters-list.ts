"use client";
import * as React from "react";
import type { Matter, MatterDeadline, MatterFilters, MatterSort, MatterStats, MatterTask } from "../types";
import { trpcReact } from "@/clients";

export interface UseMattersListOptions {
  filters?: MatterFilters;
  sort?: MatterSort;
  scope?: string;
  pageSize?: number;
}

export interface UseMattersListResult {
  matters: Matter[];
  stats: MatterStats | null;
  deadlines: MatterDeadline[];
  tasks: MatterTask[];
  loading: boolean;
  error?: string;
  reload: () => void;
}

export function useMattersList(options: UseMattersListOptions = {}): UseMattersListResult {
  const { filters, sort, scope = "all" } = options;
  const [matters, setMatters] = React.useState<Matter[]>([]);
  const [stats, setStats] = React.useState<MatterStats | null>(null);
  const [deadlines, setDeadlines] = React.useState<MatterDeadline[]>([]);
  const [tasks, setTasks] = React.useState<MatterTask[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const [tick, setTick] = React.useState(0);

  const reload = React.useCallback(() => setTick((t) => t + 1), []);

  const status = filters?.status?.[0];
  const priority = filters?.priority?.[0];

  const { data: mattersData, isLoading: mattersLoading, error: mattersError } = trpcReact.matters.list.useQuery({
    status: status as any,
    matterType: filters?.practiceArea?.[0] as any,
    priority: priority as any,
    assignedTo: scope === "mine" ? "me" : undefined,
    search: filters?.query,
    limit: 20,
  });

  const { data: statsData, isLoading: statsLoading } = trpcReact.matters.stats.useQuery(undefined, { staleTime: 30_000 });

  const { data: attentionData, isLoading: attentionLoading } = trpcReact.matters.getAttentionRequired.useQuery(undefined, { staleTime: 30_000 });

  React.useEffect(() => {
    if (mattersLoading) {
      setLoading(true);
      return;
    }

    if (mattersError) {
      setError(mattersError.message);
      setLoading(false);
      return;
    }

    const mappedMatters: Matter[] = (mattersData?.matters ?? []).map((m: any) => ({
      id: m.id,
      matterNumber: m.matterNumber,
      name: m.title,
      description: m.description,
      status: m.status as Matter["status"],
      priority: m.priority as Matter["priority"],
      practiceArea: m.matterType,
      jurisdiction: m.jurisdiction,
      clientId: m.clientId,
      clientName: m.client?.name,
      openedAt: m.openedAt,
      updatedAt: m.updatedAt,
      closedAt: m.closedAt,
      nextDeadlineAt: m.deadlineAt,
      tags: [],
      favorite: false,
      conflictFlagged: false,
    }));

    setMatters(mappedMatters);
    setStats(statsData ?? null);

    if (attentionData) {
      setDeadlines(
        attentionData.deadlineSoon.slice(0, 10).map((d: any) => ({
          id: d.id,
          matterId: d.id,
          title: d.title,
          kind: "filing",
          dueAt: d.deadlineAt ?? new Date().toISOString(),
          completed: false,
        }))
      );
    }

    setTasks([]);
    setLoading(false);
    setError(undefined);
  }, [mattersData, mattersLoading, mattersError, statsData, attentionData, tick]);

  return { matters, stats, deadlines, tasks, loading, error, reload };
}