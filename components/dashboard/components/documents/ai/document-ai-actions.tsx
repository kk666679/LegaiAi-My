// components/documents/ai/document-ai-actions.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  FileSearch,
  Lightbulb,
  Scale,
  ScrollText,
  Sparkles,
} from "lucide-react";

export interface DocumentAIAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
}

export interface DocumentAIActionsProps {
  onAction?: (id: string) => void;
  actions?: DocumentAIAction[];
}

const DEFAULT_ACTIONS: DocumentAIAction[] = [
  { id: "summarise", label: "Summarise", icon: <ScrollText className="size-4" /> },
  { id: "explain", label: "Explain", icon: <Lightbulb className="size-4" /> },
  { id: "risks", label: "Find risks", icon: <Scale className="size-4" /> },
  { id: "obligations", label: "Obligations", icon: <FileSearch className="size-4" /> },
  { id: "dates", label: "Important dates", icon: <CalendarClock className="size-4" /> },
  { id: "analyse", label: "Analyse", icon: <Sparkles className="size-4" /> },
];

export function DocumentAIActions({
  actions = DEFAULT_ACTIONS,
  onAction,
}: DocumentAIActionsProps) {
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
