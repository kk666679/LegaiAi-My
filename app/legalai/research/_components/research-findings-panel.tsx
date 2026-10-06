"use client";
// app/legalai/research/_components/research-findings-panel.tsx
import * as React from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, GitBranch, MinusCircle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Finding, FindingKind } from "./types";
import { FINDING_KIND_LABELS } from "./types";
import { ConfidenceMeter } from "./metric-meters";

const FINDING_TONE: Record<FindingKind, { bg: string; icon: React.ReactNode }> = {
  holding: { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: <CheckCircle2 className="size-3.5" /> },
  ratio: { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: <Sparkles className="size-3.5" /> },
  obiter: { bg: "bg-muted text-muted-foreground", icon: <MinusCircle className="size-3.5" /> },
  distinguishing: { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: <GitBranch className="size-3.5" /> },
  analogy: { bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", icon: <GitBranch className="size-3.5" /> },
  contradiction: { bg: "bg-destructive/10 text-destructive", icon: <AlertTriangle className="size-3.5" /> },
  gap: { bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400", icon: <AlertTriangle className="size-3.5" /> },
};

export function ResearchFindingsPanel({
  findings,
  sessionId,
  onOpenFinding,
}: {
  findings: Finding[];
  sessionId: string;
  onOpenFinding?: (finding: Finding) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <p className="text-sm font-medium">AI findings</p>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {findings.length} insight{findings.length === 1 ? "" : "s"} from {sessionId}
        </p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {findings.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">No findings yet.</p>
        ) : (
          findings.map((f) => {
            const tone = FINDING_TONE[f.kind];
            return (
              <Card
                key={f.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenFinding?.(f)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onOpenFinding?.(f);
                }}
                className="cursor-pointer p-3 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start gap-2">
                  <div className={cn("mt-0.5 rounded p-1.5", tone.bg)}>{tone.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className={cn("border-transparent text-[10px]", tone.bg)}>
                        {FINDING_KIND_LABELS[f.kind]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium leading-snug">{f.title}</p>
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{f.summary}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      {typeof f.confidence === "number" ? (
                        <ConfidenceMeter value={f.confidence} compact />
                      ) : null}
                      {f.authorityIds.length > 0 ? (
                        <span className="text-[10px] text-muted-foreground">
                          {f.authorityIds.length} source{f.authorityIds.length === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
