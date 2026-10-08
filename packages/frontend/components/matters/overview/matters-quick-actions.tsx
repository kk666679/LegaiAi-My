// components/matters/overview/matters-quick-actions.tsx
"use client";

import * as React from "react";
import {
  Briefcase,
  Clock,
  FileSignature,
  ListChecks,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface MattersQuickActionsProps {
  onNewMatter?: () => void;
  onLogTime?: () => void;
  onNewTask?: () => void;
  onNewDeadline?: () => void;
  onRunConflicts?: () => void;
  onOpenTemplates?: () => void;
}

export function MattersQuickActions({
  onNewMatter,
  onLogTime,
  onNewTask,
  onNewDeadline,
  onRunConflicts,
  onOpenTemplates,
}: MattersQuickActionsProps) {
  const actions = [
    { label: "New matter", icon: Briefcase, onClick: onNewMatter },
    { label: "Log time", icon: Clock, onClick: onLogTime },
    { label: "New task", icon: ListChecks, onClick: onNewTask },
    { label: "Add deadline", icon: CalendarClock, onClick: onNewDeadline },
    { label: "Run conflict check", icon: AlertTriangle, onClick: onRunConflicts },
    { label: "Matter templates", icon: FileSignature, onClick: onOpenTemplates },
  ];
  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-medium">Quick actions</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button key={a.label} variant="outline" size="sm" className="gap-2" onClick={a.onClick}>
            <a.icon className="size-4" />
            {a.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
