// components/matters/overview/matters-overview.tsx
"use client";

import * as React from "react";
import type { Matter, MatterDeadline, MatterStats, MatterTask } from "../types";
import { MattersSummary } from "./matters-summary";
import { MattersQuickActions } from "./matters-quick-actions";
import { RecentMatters } from "./recent-matters";
import { UpcomingDeadlines } from "./upcoming-deadlines";
import { MyTasks } from "./my-tasks";

export interface MattersOverviewProps {
  stats: MatterStats;
  recent: Matter[];
  deadlines: MatterDeadline[];
  tasks: MatterTask[];
  onNewMatter?: () => void;
  onLogTime?: () => void;
  onNewTask?: () => void;
  onNewDeadline?: () => void;
  onRunConflicts?: () => void;
  onOpenTemplates?: () => void;
  onOpenMatter?: (matter: Matter) => void;
  onOpenDeadline?: (deadline: MatterDeadline) => void;
  onOpenTask?: (task: MatterTask) => void;
  onViewAllMatters?: () => void;
}

export function MattersOverview({
  stats,
  recent,
  deadlines,
  tasks,
  onNewMatter,
  onLogTime,
  onNewTask,
  onNewDeadline,
  onRunConflicts,
  onOpenTemplates,
  onOpenMatter,
  onOpenDeadline,
  onOpenTask,
  onViewAllMatters,
}: MattersOverviewProps) {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <MattersSummary stats={stats} />
      <MattersQuickActions
        onNewMatter={onNewMatter}
        onLogTime={onLogTime}
        onNewTask={onNewTask}
        onNewDeadline={onNewDeadline}
        onRunConflicts={onRunConflicts}
        onOpenTemplates={onOpenTemplates}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentMatters matters={recent} onOpen={onOpenMatter} onViewAll={onViewAllMatters} />
        </div>
        <div className="space-y-6">
          <UpcomingDeadlines deadlines={deadlines} onOpen={onOpenDeadline} />
          <MyTasks tasks={tasks} onOpen={onOpenTask} />
        </div>
      </div>
    </div>
  );
}
