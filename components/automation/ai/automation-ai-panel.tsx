// components/automation/ai/automation-ai-panel.tsx
"use client";

import * as React from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  Loader2,
  Maximize2,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AutomationAIAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  prompt: string;
}

const DEFAULT_ACTIONS: AutomationAIAction[] = [
  { id: "recommend", label: "Recommend steps", icon: <Bot className="size-3.5" />, prompt: "Suggest missing steps for this workflow" },
  { id: "layout", label: "Optimize layout", icon: <Maximize2 className="size-3.5" />, prompt: "Suggest a cleaner node layout" },
  { id: "risks", label: "Find gaps", icon: <Activity className="size-3.5" />, prompt: "Find gaps or dead-ends in this workflow" },
  { id: "path", label: "Optimize path", icon: <ArrowRight className="size-3.5" />, prompt: "Suggest a shorter path through the workflow" },
  { id: "edges", label: "Suggest edges", icon: <Zap className="size-3.5" />, prompt: "Suggest missing edges or dead-ends" },
];

export interface AutomationAIPanelProps {
  actions?: AutomationAIAction[];
  result?: string;
  busy?: boolean;
  onRun?: (action: AutomationAIAction) => void | Promise<void>;
  onClose?: () => void;
  className?: string;
}

export function AutomationAIPanel({
  actions = DEFAULT_ACTIONS,
  result,
  busy,
  onRun,
  onClose,
  className,
}: AutomationAIPanelProps) {
  return (
    <section
      aria-label="AI assistant"
      className={cn("border-t border-border/60 bg-muted/20 p-3", className)}
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            AI Elements
          </p>
          <p className="text-sm font-semibold">Automation intelligence</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          <Sparkles className="size-3" /> Live
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {actions.map((a) => (
          <Button
            key={a.id}
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={busy}
            onClick={() => onRun?.(a)}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : a.icon}
            {a.label}
          </Button>
        ))}
        {onClose ? (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={onClose}>
            Close
          </Button>
        ) : null}
      </div>

      {result ? (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-border/60 bg-background p-2.5 text-xs">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p className="leading-relaxed">{result}</p>
        </div>
      ) : null}
    </section>
  );
}
