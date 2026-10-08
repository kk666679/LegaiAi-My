// components/matters/overview/my-tasks.tsx
"use client";

import * as React from "react";
import { ListChecks } from "lucide-react";
import type { MatterTask } from "../types";

export interface MyTasksProps {
  tasks: MatterTask[];
  onOpen?: (task: MatterTask) => void;
}

export function MyTasks({ tasks, onOpen }: MyTasksProps) {
  return (
    <section aria-labelledby="my-tasks-heading" className="space-y-2">
      <h2 id="my-tasks-heading" className="text-sm font-medium">
        My tasks
      </h2>
      {tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground">No open tasks assigned to you.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.slice(0, 6).map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onOpen?.(t)}
                className="flex w-full items-start gap-3 rounded-md border border-border/60 bg-card p-2.5 text-left transition-colors hover:border-primary/40"
              >
                <ListChecks className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.dueAt ? new Date(t.dueAt).toLocaleDateString() : "No due date"} · {t.status}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
