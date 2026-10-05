"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AIStatistic } from "@/components/lawmate/ai/aistatistic";
import { AITrendBadge } from "@/components/lawmate/ai/aitrend-badge";
import { cn } from "@/lib/utils";
import type { DebateScoreRow, DebateMomentumPoint, DebateCriterionKey } from "@/types/debate";
import { DEBATE_CRITERIA, DEBATE_SIDE_LABELS } from "@/types/debate";
import { DebateStatusBadge } from "../core/debate-status";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Legacy shim                                                         */
/* ------------------------------------------------------------------ */

interface LegacyScoreboardProps {
  applicant: number;
  respondent: number;
  winner: "applicant" | "respondent" | null;
}

export function Scoreboard({ applicant, respondent, winner }: LegacyScoreboardProps) {
  const rows: DebateScoreRow[] = [
    {
      participantId: "applicant",
      overall: applicant,
      confidence: 0.8,
      criteria: [{ criterion: "legal-reasoning", label: "Score", score: applicant }],
    },
    {
      participantId: "respondent",
      overall: respondent,
      confidence: 0.8,
      criteria: [{ criterion: "legal-reasoning", label: "Score", score: respondent }],
    },
  ];
  return <DebateScoreboard rows={rows} />;
}

/* ------------------------------------------------------------------ */
/* New scoreboard                                                     */
/* ------------------------------------------------------------------ */

export interface DebateScoreboardProps {
  rows: DebateScoreRow[];
  momentum?: DebateMomentumPoint[];
  criteria?: DebateCriterionKey[];
  /** Label used for the heading row. */
  title?: string;
  className?: string;
}

function CriterionRow({ row, criterion }: { row: DebateScoreRow; criterion: { key: DebateCriterionKey; label: string } }) {
  const score = row.criteria.find((c) => c.criterion === criterion.key);
  return (
    <TableRow key={criterion.key}>
      <TableCell className="text-xs font-medium">{criterion.label}</TableCell>
      <TableCell className="text-right">
        <span className="text-xs tabular-nums">{score?.score ?? "—"}</span>
      </TableCell>
    </TableRow>
  );
}

export function DebateScoreboard({ rows, momentum, criteria, title = "Debate Score", className }: DebateScoreboardProps) {
  const criteriaToRender = criteria ?? Object.keys(DEBATE_CRITERIA) as DebateCriterionKey[];

  const winnerRow = rows.reduce<DebateScoreRow | null>((best, row) => {
    if (!best) return row;
    return row.overall > best.overall ? row : best;
  }, null);

  return (
    <Card className={cn("gap-0", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          {winnerRow ? (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Trophy className="size-3" />
              {winnerRow.overall} pts · {winnerRow.participantId}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {rows.map((row) => (
            <div key={row.participantId} className="space-y-1.5 rounded-md border bg-card/50 p-2.5">
              <span className="text-xs font-medium">{row.participantId}</span>
              <div className="text-2xl font-semibold tabular-nums">{row.overall}</div>
              <div className="flex items-center gap-1.5">
                <Progress value={row.overall} className="h-1.5 flex-1" />
                {row.confidence !== undefined ? (
                  <AITrendBadge trend={Math.round((row.confidence - 0.5) * 200)} size="sm" />
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {criteriaToRender.length > 0 ? (
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Criteria breakdown</span>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 text-[10px]">Criterion</TableHead>
                  <TableHead className="h-8 w-16 text-right text-[10px]">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) =>
                  criteriaToRender.map((criterion) => (
                    <CriterionRow key={`${row.participantId}-${criterion}`} row={row} criterion={{ key: criterion, label: DEBATE_CRITERIA[criterion] }} />
                  )),
                )}
              </TableBody>
            </Table>
          </div>
        ) : null}

        {momentum && momentum.length > 0 ? (
          <MomentumIndicator points={momentum} className="text-xs" />
        ) : null}
      </CardContent>
    </Card>
  );
}

export interface MomentumIndicatorProps {
  points: DebateMomentumPoint[];
  className?: string;
}

export function MomentumIndicator({ points, className }: MomentumIndicatorProps) {
  const ids = Object.keys(points[0]?.scores ?? {});
  if (ids.length === 0 || points.length === 0) return null;

  const max = Math.max(...points.map((p) => Math.max(...Object.values(p.scores))));
  const width = 100 / Math.max(1, points.length - 1);

  return (
    <div className={cn("space-y-2", className)}>
      <span className="text-xs font-medium text-muted-foreground">Momentum</span>
      <div className="space-y-1">
        {ids.map((id) => (
          <div key={id} className="flex items-center gap-2">
            <span className="w-20 truncate text-[10px] text-muted-foreground">{id}</span>
            <div className="relative h-2 flex-1 rounded-full bg-muted">
              {points.map((pt, idx) => {
                const val = pt.scores[id] ?? 0;
                const left = idx * width;
                return (
                  <div
                    key={idx}
                    className="absolute top-0 h-full rounded-full bg-primary/70"
                    style={{ left: `${left}%`, width: `${width}%`, maxWidth: `${100 - left}%` }}
                    title={`${pt.roundLabel}: ${val}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex justify-between text-[10px] text-muted-foreground">
          {points.map((pt) => (
            <span key={pt.roundIndex}>{pt.roundLabel}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
