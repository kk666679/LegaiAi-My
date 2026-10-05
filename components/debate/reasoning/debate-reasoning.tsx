"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReasoningPanel } from "@/components/lawmate/ai/legal/reasoning-panel";
import { cn } from "@/lib/utils";
import type { DebateArgument } from "@/types/debate";

/**
 * Wraps `ReasoningPanel` (IRAC + assumptions + missing info) for a debate
 * argument. Does not invent private chain-of-thought — it surfaces the
 * verified reasoning steps the advocate has disclosed.
 */

export interface DebateReasoningProps {
  argument: Pick<DebateArgument, "claim" | "reasoning" | "weaknesses">;
  assumptions?: string[];
  missingInfo?: string[];
  className?: string;
}

export function DebateReasoning({
  argument,
  assumptions = [],
  missingInfo = argument.weaknesses ?? [],
  className,
}: DebateReasoningProps) {
  const irac = [
    { label: "Issue", content: argument.claim },
    ...(argument.reasoning ?? []).map((step, idx) => ({
      label: `Step ${idx + 1}`,
      content: step,
    })),
  ];

  return (
    <ReasoningPanel
      irac={irac}
      assumptions={assumptions}
      missingInfo={missingInfo}
      className={className}
    />
  );
}

export interface ReasoningStepProps {
  label: string;
  description?: string;
  status?: "complete" | "active" | "pending";
  icon?: React.ReactNode;
  className?: string;
}

export function ReasoningStep({ label, description, status = "complete", icon, className }: ReasoningStepProps) {
  const dotColor =
    status === "active"
      ? "bg-purple-500 animate-pulse"
      : status === "pending"
        ? "bg-muted-foreground/40"
        : "bg-emerald-500";
  return (
    <li className={cn("flex gap-2.5", className)}>
      <span className="relative flex flex-col items-center">
        <span className={cn("size-2 rounded-full", dotColor)} />
        <span className="mt-1 h-full w-px bg-border" />
      </span>
      <div className="space-y-0.5 pb-3">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
          <span className="text-sm font-medium">{label}</span>
        </div>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
    </li>
  );
}

export interface LogicChainProps {
  steps: Array<{ label: string; description?: string; status?: "complete" | "active" | "pending" }>;
  className?: string;
}

export function LogicChain({ steps, className }: LogicChainProps) {
  return (
    <ol className={cn("space-y-0", className)}>
      {steps.map((step, idx) => (
        <ReasoningStep key={idx} label={step.label} description={step.description} status={step.status} />
      ))}
    </ol>
  );
}
