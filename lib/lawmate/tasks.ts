// Local task data layer for the Tasks workspace page and matter task tabs.
//
// The backend exposes no task procedures (no `tasks.*` tRPC router), so tasks
// are stored in this browser's localStorage. This is a LOCAL-ONLY store:
// tasks never leave this device and are not shared with the server. The UI
// labels this clearly so sample/local tasks are never mistaken for
// backend-backed records.

import type { MatterPriority, MatterTaskStatus } from "@/components/matters/types";

export const TASKS_STORAGE_KEY = "lawmate:tasks:v1";

export interface WorkspaceTask {
  id: string;
  title: string;
  description?: string;
  status: MatterTaskStatus;
  priority: MatterPriority;
  assignee?: string;
  /** Matter id when the task belongs to a matter; empty for workspace tasks. */
  matterId?: string;
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
  /** True when the task came from the bundled sample set. */
  sample?: boolean;
}

export const TASK_STATUSES: MatterTaskStatus[] = [
  "todo",
  "in-progress",
  "blocked",
  "review",
  "done",
  "cancelled",
];

export const TASK_STATUS_LABELS: Record<MatterTaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  blocked: "Blocked",
  review: "In review",
  done: "Done",
  cancelled: "Cancelled",
};

export const TASK_PRIORITIES: MatterPriority[] = ["low", "normal", "high", "urgent"];

export const TASK_PRIORITY_LABELS: Record<MatterPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const TASK_ASSIGNEES = [
  "Aina Rahman",
  "Lim Wei Jian",
  "Siti Nurhaliza",
  "Raj Kumar",
];

export function createTaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Days from now (negative = overdue). Returns null when no due date. */
export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const due = new Date(iso).getTime();
  if (Number.isNaN(due)) return null;
  const day = 24 * 60 * 60 * 1000;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((due - today) / day);
}

export function isOverdue(task: WorkspaceTask): boolean {
  if (task.status === "done" || task.status === "cancelled") return false;
  const d = daysUntil(task.dueAt);
  return d !== null && d < 0;
}

/** Seed sample tasks — clearly marked `sample: true`. */
export function seedTasks(): WorkspaceTask[] {
  const now = new Date().toISOString();
  const day = 24 * 60 * 60 * 1000;
  const inDays = (n: number) => new Date(Date.now() + n * day).toISOString();
  return [
    {
      id: createTaskId(),
      title: "Review filed defence for TechNova v Lim",
      description: "Check limitation defence and endorse the final version for filing.",
      status: "in-progress",
      priority: "urgent",
      assignee: "Aina Rahman",
      dueAt: inDays(2),
      createdAt: now,
      updatedAt: now,
      sample: true,
    },
    {
      id: createTaskId(),
      title: "Draft show-cause response for Employment Act matter",
      description: "Prepare a response within the 14-day window; attach witness statements.",
      status: "todo",
      priority: "high",
      assignee: "Lim Wei Jian",
      dueAt: inDays(5),
      createdAt: now,
      updatedAt: now,
      sample: true,
    },
    {
      id: createTaskId(),
      title: "Citation check on PDPA 2010 s.43 memo",
      description: "Verify every authority against the LOM catalogue before circulation.",
      status: "review",
      priority: "normal",
      assignee: "Siti Nurhaliza",
      dueAt: inDays(1),
      createdAt: now,
      updatedAt: now,
      sample: true,
    },
    {
      id: createTaskId(),
      title: "Conflict check for new corporate client",
      description: "Run party conflict search across active matters and record the result.",
      status: "blocked",
      priority: "high",
      assignee: "Raj Kumar",
      dueAt: inDays(-1),
      createdAt: now,
      updatedAt: now,
      sample: true,
    },
    {
      id: createTaskId(),
      title: "Quarterly ESG disclosure review",
      description: "Review Bursa sustainability disclosure obligations for the listed client.",
      status: "todo",
      priority: "normal",
      assignee: "Aina Rahman",
      dueAt: inDays(9),
      createdAt: now,
      updatedAt: now,
      sample: true,
    },
    {
      id: createTaskId(),
      title: "Archive closed matter files",
      description: "Move completed matter documents to the archive and update the index.",
      status: "done",
      priority: "low",
      assignee: "Raj Kumar",
      createdAt: now,
      updatedAt: now,
      sample: true,
    },
  ];
}
