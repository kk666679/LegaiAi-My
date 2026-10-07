"use client";

import * as React from "react";
import {
  seedTasks,
  TASKS_STORAGE_KEY,
  type WorkspaceTask,
} from "@/lib/lawmate/tasks";

/**
 * Hydration-safe localStorage-backed task store.
 *
 * The first client render matches the server render (seeded sample tasks);
 * persisted tasks are loaded in an effect after mount so SSR and hydration
 * output stay identical. Every write persists to localStorage.
 *
 * LOCAL ONLY — there is no backend task service; see lib/lawmate/tasks.ts.
 */
export function useLocalTasks(): {
  tasks: WorkspaceTask[];
  setTasks: React.Dispatch<React.SetStateAction<WorkspaceTask[]>>;
  addTask: (task: WorkspaceTask) => void;
  updateTask: (id: string, patch: Partial<WorkspaceTask>) => void;
  removeTask: (id: string) => void;
} {
  const [tasks, setTasks] = React.useState<WorkspaceTask[]>(seedTasks);
  const hydrated = React.useRef(false);

  React.useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setTasks(parsed as WorkspaceTask[]);
      }
    } catch {
      // Corrupt or unavailable storage — keep the seeded defaults.
    }
  }, []);

  const persist = React.useCallback(
    (next: WorkspaceTask[]) => {
      try {
        window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage full/unavailable — state still updates in memory.
      }
    },
    [],
  );

  const setTasksPersisted: React.Dispatch<React.SetStateAction<WorkspaceTask[]>> =
    React.useCallback(
      (action) => {
        setTasks((prev) => {
          const next =
            typeof action === "function"
              ? (action as (prev: WorkspaceTask[]) => WorkspaceTask[])(prev)
              : action;
          persist(next);
          return next;
        });
      },
      [persist],
    );

  const addTask = React.useCallback(
    (task: WorkspaceTask) => setTasksPersisted((prev) => [task, ...prev]),
    [setTasksPersisted],
  );

  const updateTask = React.useCallback(
    (id: string, patch: Partial<WorkspaceTask>) =>
      setTasksPersisted((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, ...patch, updatedAt: new Date().toISOString() }
            : t,
        ),
      ),
    [setTasksPersisted],
  );

  const removeTask = React.useCallback(
    (id: string) => setTasksPersisted((prev) => prev.filter((t) => t.id !== id)),
    [setTasksPersisted],
  );

  return { tasks, setTasks: setTasksPersisted, addTask, updateTask, removeTask };
}
