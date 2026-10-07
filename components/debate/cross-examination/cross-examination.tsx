"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AIBadge } from "@/components/ai/aibadge";
import { EvidencePanel } from "@/components/ai/legal/evidence-panel";
import { ConfidenceIndicator } from "@/components/ai/legal/confidence";
import { cn } from "@/lib/utils";
import type { DebateExaminationItem, DebateSide } from "@/types/debate";
import { DEBATE_SIDE_LABELS } from "@/types/debate";
import { ParticipantStatus, participantInitials } from "../participants/participant-status";
import { HelpCircle, MessageSquareQuote, ShieldCheck, ShieldQuestion } from "lucide-react";

const STAGE_LABEL: Record<string, string> = {
  question: "Question",
  answer: "Answer",
  "follow-up": "Follow-up",
  challenge: "Challenge",
  assessment: "Assessment",
};

const STAGE_ICON: Record<string, typeof HelpCircle> = {
  question: HelpCircle,
  answer: MessageSquareQuote,
  "follow-up": HelpCircle,
  challenge: ShieldQuestion,
  assessment: ShieldCheck,
};

const SIDE_CLS: Record<DebateSide, string> = {
  proponent: "border-l-cyan-500/60 bg-cyan-500/[0.04]",
  opponent: "border-l-purple-500/60 bg-purple-500/[0.04]",
  neutral: "border-l-yellow-500/60 bg-yellow-500/[0.04]",
};

export interface CrossExaminationProps {
  items: DebateExaminationItem[];
  /** Map of participant id → name for display. */
  participants: Record<string, { name: string; side: DebateSide }>;
  evidence: import("@/types/debate").DebateEvidence[];
  className?: string;
}

export function CrossExamination({ items, participants, evidence, className }: CrossExaminationProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => {
        const asker = participants[item.questionerId];
        const answerer = item.answererId ? participants[item.answererId] : undefined;
        const AskIcon = STAGE_ICON[item.stage] ?? HelpCircle;
        const evidenceItems = item.evidenceIds
          ?.flatMap((id) => evidence.filter((entry) => entry.id === id)) ?? [];

        return (
          <Card key={item.id} className={cn("gap-0 overflow-hidden border-l-2", SIDE_CLS[asker?.side ?? "neutral"])}>
            <CardHeader className="space-y-2 pb-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {STAGE_LABEL[item.stage] ?? item.stage}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AskIcon className="size-3" />
                  <span>{asker?.name ?? item.questionerId}</span>
                  <span>asks</span>
                </div>
                {answerer ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Avatar className="size-4">
                      <AvatarImage src="" alt="" />
                      <AvatarFallback className="text-[8px]">{participantInitials({ name: answerer.name, initials: undefined })}</AvatarFallback>
                    </Avatar>
                    <span>{answerer.name}</span>
                  </div>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {item.question ? (
                <p className="text-sm leading-relaxed">{item.question}</p>
              ) : null}
              {item.answer ? (
                <>
                  <Separator />
                  <div className={cn("rounded-md border-l-2 pl-3 py-1", SIDE_CLS[answerer?.side ?? "neutral"])}>
                    <p className="text-sm leading-relaxed">{item.answer}</p>
                  </div>
                </>
              ) : null}

              {item.assessment ? (
                <div className="flex flex-wrap items-center gap-2">
                  <ConfidenceIndicator
                    level={item.assessment === "strong" ? "high" : item.assessment === "weak" ? "low" : "medium"}
                  />
                  {item.assessmentNote ? (
                    <p className="text-xs text-muted-foreground">{item.assessmentNote}</p>
                  ) : null}
                </div>
              ) : null}

              {evidenceItems && evidenceItems.length > 0 ? (
                <EvidencePanel
                  evidence={evidenceItems.map((ev) => ({
                    title: ev.title,
                    citation: ev.citation,
                    verificationStatus: ev.verificationStatus,
                    confidence: ev.confidence,
                    excerpt: ev.excerpt,
                  }))}
                  title="Evidence put to the witness"
                  className="text-xs"
                />
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {items.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">No cross-examination items recorded.</p>
      ) : null}
    </div>
  );
}
