"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AIBadge } from "@/components/ai/aibadge";
import { ConfidenceIndicator } from "@/components/ai/legal/confidence";
import { EvidencePanel } from "@/components/ai/legal/evidence-panel";
import { cn } from "@/lib/utils";
import type { DebateArgument, DebateSide } from "@/types/debate";
import { DEBATE_ENTRY_LABELS } from "@/types/debate";
import {
  ParticipantKindBadge,
  ParticipantStatus,
  ParticipantClassification,
  participantInitials,
} from "../participants/participant-status";
import { ArrowDownToLine, ChevronDown, ShieldQuestion, Swords } from "lucide-react";

const SIDE_CONFIG: Record<DebateSide, { cls: string; border: string; icon: typeof Swords }> = {
  proponent: {
    cls: "border-l-2 border-l-cyan-500/60 bg-cyan-500/[0.04]",
    border: "border-cyan-500/30",
    icon: Swords,
  },
  opponent: {
    cls: "border-l-2 border-l-purple-500/60 bg-purple-500/[0.04]",
    border: "border-purple-500/30",
    icon: Swords,
  },
  neutral: {
    cls: "border-l-2 border-l-yellow-500/60 bg-yellow-500/[0.04]",
    border: "border-yellow-500/30",
    icon: ShieldQuestion,
  },
};

export interface ArgumentCardProps {
  argument: DebateArgument;
  /** Called when the user selects a counter/rebuttal/challenge action. */
  onAction?: (argument: DebateArgument, action: "counter" | "rebut" | "challenge") => void;
  className?: string;
}

export function ArgumentCard({ argument, onAction, className }: ArgumentCardProps) {
  const cfg = SIDE_CONFIG[argument.side];
  const Icon = cfg.icon;
  const confidence = argument.confidence ?? 0.5;
  const confidenceLevel: "high" | "medium" | "low" | "insufficient" =
    confidence >= 0.8 ? "high" : confidence >= 0.6 ? "medium" : confidence >= 0.35 ? "low" : "insufficient";

  return (
    <Card className={cn("gap-0 overflow-hidden", cfg.cls, className)}>
      <CardHeader className="space-y-2.5 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Icon className={cn("size-3.5", argument.side === "proponent" ? "text-cyan-500" : argument.side === "opponent" ? "text-purple-500" : "text-yellow-500")} />
          <CardTitle className="text-sm font-semibold">
            {argument.kind === "argument" ? "Claim" : argument.kind === "counterargument" ? "Counterargument" : argument.kind === "rebuttal" ? "Rebuttal" : argument.kind === "response" ? "Response" : argument.kind === "objection" ? "Objection" : argument.kind === "concession" ? "Concession" : argument.kind === "judgment" ? "Judgement" : argument.kind === "question" ? "Question" : argument.kind === "answer" ? "Answer" : argument.kind}
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {argument.side}
          </Badge>
          {argument.conceded ? (
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-600">
              Conceded
            </Badge>
          ) : null}
          <span className="ml-auto text-xs text-muted-foreground">
            {argument.confidence !== undefined ? `${Math.round(confidence * 100)}%` : ""}
          </span>
        </div>
        <p className="text-sm leading-relaxed">{argument.claim}</p>
      </CardHeader>

      {(argument.reasoning && argument.reasoning.length > 0) || argument.citations ? (
        <CardContent className="space-y-3">
          {argument.reasoning && argument.reasoning.length > 0 ? (
            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                <ChevronDown className="size-3 transition-transform" />
                Reasoning ({argument.reasoning.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-1.5 pl-1">
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  {argument.reasoning.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </CollapsibleContent>
            </Collapsible>
          ) : null}

          {argument.citations && argument.citations.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {argument.citations.map((cit) => (
                <Badge
                  key={cit.id}
                  variant="secondary"
                  className="font-mono text-[10px]"
                  title={cit.href ? cit.href : undefined}
                >
                  {cit.label}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <ConfidenceIndicator level={confidenceLevel} className="text-xs" />
          </div>

          {onAction ? (
            <div className="flex flex-wrap gap-2">
              {argument.kind !== "counterargument" && argument.kind !== "response" && argument.kind !== "objection" && argument.kind !== "concession" ? (
                <>
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onAction(argument, "counter")}>
                    <ArrowDownToLine className="size-3" /> Counter
                  </Button>
                  {argument.kind !== "rebuttal" ? (
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => onAction(argument, "rebut")}>
                      Rebut
                    </Button>
                  ) : null}
                </>
              ) : null}
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => onAction(argument, "challenge")}>
                <ShieldQuestion className="size-3" /> Challenge
              </Button>
            </div>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
