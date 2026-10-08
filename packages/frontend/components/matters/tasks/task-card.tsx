// components/matters/tasks/task-card.tsx
"use client";

import * as React from "react";
import { Calendar, CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MatterTask } from "../types";
import { TaskStatusIndicator } from "./task-status-indicator";

export interface TaskCardProps {
  task: MatterTask;
  onToggle?: (task: MatterTask) => void;
  onSelect?: (task: MatterTask) => void;
}

export function TaskCard({ task, onToggle, onSelect }: TaskCardProps) {
  const done = task.status === "done";
  return (
    <Card
      className={cn("group flex items-start gap-2 p-2.5 transition-colors hover:border-primary/40", onSelect && "cursor-pointer")}
      onClick={() => onSelect?.(task)}
    >
      <button
        type="button"
        aria-label={done ? "Mark as not done" : "Mark as done"}
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.(task);
        }}
        className="mt-0.5 text-muted-foreground hover:text-foreground"
      >
        {done ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Circle className="size-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", done && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        {task.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <TaskStatusIndicator status={task.status} />
          {task.dueAt ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="size-3" /> {new Date(task.dueAt).toLocaleDateString()}
            </span>
          ) : null}
          {task.assigneeName ? (
            <span className="text-[10px] text-muted-foreground">@{task.assigneeName}</span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
