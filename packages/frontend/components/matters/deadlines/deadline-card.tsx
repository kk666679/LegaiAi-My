// components/matters/deadlines/deadline-card.tsx
"use client";

import * as React from "react";
import { CalendarClock, CheckCircle2, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MatterDeadline } from "../types";

export interface DeadlineCardProps {
  deadline: MatterDeadline;
  onSelect?: (deadline: MatterDeadline) => void;
}

export function DeadlineCard({ deadline, onSelect }: DeadlineCardProps) {
  const due = new Date(deadline.dueAt);
  const overdue = !deadline.completed && due.getTime() < Date.now();
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(deadline)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect?.(deadline);
      }}
      className={cn(
        "cursor-pointer p-3 transition-colors hover:border-primary/40",
        overdue && "border-destructive/40 bg-destructive/5",
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("rounded-md p-2", deadline.completed ? "bg-muted text-muted-foreground" : "bg-amber-500/10 text-amber-600 dark:text-amber-400")}>
          {deadline.completed ? <CheckCircle2 className="size-4" /> : <CalendarClock className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-medium", deadline.completed && "line-through text-muted-foreground")}>
            {deadline.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {due.toLocaleString()} · {deadline.kind}
          </p>
          {deadline.location ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" /> {deadline.location}
            </p>
          ) : null}
          {deadline.responsibleName ? (
            <p className="mt-0.5 text-xs text-muted-foreground">Responsible: {deadline.responsibleName}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
