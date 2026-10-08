// components/matters/ai/matter-ai-actions.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  FileSearch,
  Lightbulb,
  ListChecks,
  ScrollText,
  Sparkles,
} from "lucide-react";

export interface MatterAIAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
}

export interface MatterAIActionsProps {
  actions?: MatterAIAction[];
  onAction?: (id: string) => void;
}

const DEFAULT_ACTIONS: MatterAIAction[] = [
  { id: "summarise", label: "Summarise matter", icon: <ScrollText className="size-4" /> },
  { id: "risks", label: "Find risks", icon: <Lightbulb className="size-4" /> },
  { id: "obligations", label: "Obligations", icon: <ListChecks className="size-4" /> },
  { id: "deadlines", label: "Extract deadlines", icon: <CalendarClock className="size-4" /> },
  { id: "documents", label: "Review documents", icon: <FileSearch className="size-4" /> },
  { id: "draft", label: "Draft letter", icon: <Sparkles className="size-4" /> },
];

export function MatterAIActions({ actions = DEFAULT_ACTIONS, onAction }: MatterAIActionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((a) => (
        <Button
          key={a.id}
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => {
            a.onSelect?.();
            onAction?.(a.id);
          }}
        >
          {a.icon}
          {a.label}
        </Button>
      ))}
    </div>
  );
}
