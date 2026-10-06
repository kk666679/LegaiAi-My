import { useMemo } from "react";
import type { WorkflowMeta, WorkflowStats } from "../types";

export interface UseAutomationListOptions {
  query?: string;
}

export interface UseAutomationListResult {
  workflows: WorkflowMeta[];
  statsById: Record<string, WorkflowStats>;
  loading: boolean;
  error: string | null;
}

const MOCK_WORKFLOWS: WorkflowMeta[] = [
  {
    id: "wf-intake",
    name: "Client intake triage",
    description: "Route new intakes to the right practice group and open a matter.",
    category: "Litigation",
    status: "active",
    ownerId: "usr-1",
    ownerName: "Aisha Rahman",
    matterId: "mat-1021",
    tags: ["intake", "litigation"],
    createdAt: "2026-09-12T08:24:00Z",
    updatedAt: "2026-10-03T09:11:00Z",
  },
  {
    id: "wf-contract",
    name: "Contract review pipeline",
    description: "NDA and service agreements review with clause extraction.",
    category: "Corporate",
    status: "active",
    ownerId: "usr-2",
    ownerName: "Daniel Tan",
    matterId: "mat-1088",
    tags: ["contract", "corporate"],
    createdAt: "2026-08-05T10:00:00Z",
    updatedAt: "2026-10-01T14:32:00Z",
  },
  {
    id: "wf-chronology",
    name: "Matter chronology builder",
    description: "Summarise events from uploaded briefing documents.",
    category: "Advisory",
    status: "draft",
    ownerId: "usr-1",
    ownerName: "Aisha Rahman",
    tags: ["advisory"],
    createdAt: "2026-09-28T11:40:00Z",
    updatedAt: "2026-09-29T09:02:00Z",
  },
  {
    id: "wf-reg-alert",
    name: "Regulatory change monitor",
    description: "Watch the Gazette feed and alert the team on updates.",
    category: "Compliance",
    status: "paused",
    ownerId: "usr-3",
    ownerName: "Faridah Lim",
    tags: ["compliance", "monitoring"],
    createdAt: "2026-07-19T07:55:00Z",
    updatedAt: "2026-09-20T16:08:00Z",
  },
  {
    id: "wf-onboard",
    name: "Client onboarding",
    description: "KYC collection and conflict check for new clients.",
    category: "Conveyancing",
    status: "archived",
    ownerId: "usr-2",
    ownerName: "Daniel Tan",
    tags: ["onboarding"],
    createdAt: "2026-06-01T09:00:00Z",
    updatedAt: "2026-08-15T10:45:00Z",
  },
];

const MOCK_STATS_BY_ID: Record<string, WorkflowStats> = {
  "wf-intake": { totalRuns: 128, successRate: 92, avgDurationMs: 3400, lastRunAt: "2026-10-03T09:11:00Z", activeRuns: 1 },
  "wf-contract": { totalRuns: 54, successRate: 87, avgDurationMs: 5600, lastRunAt: "2026-10-01T14:32:00Z", activeRuns: 0 },
  "wf-chronology": { totalRuns: 0, successRate: 0, avgDurationMs: 0, activeRuns: 0 },
  "wf-reg-alert": { totalRuns: 22, successRate: 75, avgDurationMs: 8200, lastRunAt: "2026-09-20T16:08:00Z", activeRuns: 0 },
  "wf-onboard": { totalRuns: 41, successRate: 95, avgDurationMs: 2900, lastRunAt: "2026-08-15T10:45:00Z", activeRuns: 0 },
};

const EMPTY_STATS: WorkflowStats = { totalRuns: 0, successRate: 0, avgDurationMs: 0, activeRuns: 0 };

export function useAutomationList(options?: UseAutomationListOptions): UseAutomationListResult {
  const query = (options?.query ?? "").trim().toLowerCase();

  return useMemo<UseAutomationListResult>(() => {
    const workflows = query
      ? MOCK_WORKFLOWS.filter((w) => {
          const hay = [w.name, w.description, w.category, w.ownerName, ...(w.tags ?? [])]
            .filter((v): v is string => typeof v === "string")
            .join(" ")
            .toLowerCase();
          return hay.includes(query);
        })
      : MOCK_WORKFLOWS;

    const statsById: Record<string, WorkflowStats> = {};
    for (const w of workflows) {
      statsById[w.id] = MOCK_STATS_BY_ID[w.id] ?? EMPTY_STATS;
    }

    return { workflows, statsById, loading: false, error: null };
  }, [query]);
}
