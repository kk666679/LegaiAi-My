"use client";
// app/lawmate/research/_components/research-compare.tsx
import * as React from "react";
import { useResearch } from "./use-research";
import { SourceCard } from "@/components/dashboard/SourceCard";
import { DashboardStateBoundary } from "@/components/dashboard/DashboardState";
import { toDashboardStatus } from "./lawmate-dashboard-adapters";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Minus } from "lucide-react";
import { AuthorityKindBadge } from "./authority-badges";
import { cn } from "@/lib/utils";

export function ResearchComparePage() {
  const { activeSession, sessionAuthorities } = useResearch({});
  const status = activeSession ? toDashboardStatus(activeSession.status) : "success";
  const [leftId, setLeftId] = React.useState<string>(sessionAuthorities[0]?.id ?? "");
  const [rightId, setRightId] = React.useState<string>(sessionAuthorities[1]?.id ?? "");

  const left = sessionAuthorities.find((a) => a.id === leftId);
  const right = sessionAuthorities.find((a) => a.id === rightId);

  if (sessionAuthorities.length < 2) {
    return (
      <div className="p-6">
        <DashboardStateBoundary status="empty" data={null} label="authorities to compare">
          {null}
        </DashboardStateBoundary>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">Compare authorities</h1>
        <p className="text-xs text-muted-foreground">
          Side-by-side view of two authorities on the same issue.
        </p>
      </header>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <select
            value={leftId}
            onChange={(e) => setLeftId(e.target.value)}
            className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm"
            aria-label="Left authority"
          >
            {sessionAuthorities.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
          <select
            value={rightId}
            onChange={(e) => setRightId(e.target.value)}
            className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm"
            aria-label="Right authority"
          >
            {sessionAuthorities.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
        </div>

        {left && right ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ComparisonPane authority={left} side="left" />
            <ComparisonPane authority={right} side="right" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ComparisonPane({ authority, side }: { authority: ReturnType<typeof useResearch>["sessionAuthorities"][number]; side: "left" | "right" }) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <AuthorityKindBadge kind={authority.kind} />
          <Badge variant="outline" className="text-[10px]">{authority.year}</Badge>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{side}</span>
      </div>
      <h3 className="text-sm font-medium">{authority.title}</h3>
      <p className="font-mono text-[11px] text-muted-foreground">{authority.citation.short}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{authority.summary}</p>
      <div className="space-y-1.5 border-t border-border/60 pt-3 text-xs">
        <CompareRow label="Kind" left={authority.kind} right={undefined} />
        <CompareRow label="Court" left={authority.court} right={undefined} />
        <CompareRow label="Relevance" left={authority.relevance} right={undefined} />
      </div>
    </Card>
  );
}

function CompareRow({
  label,
  left,
  right,
}: {
  label: string;
  left: unknown;
  right: unknown;
}) {
  const same = left === right;
  const Icon = same ? Check : Minus;
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1">
        <Icon className={cn("size-3", same ? "text-emerald-500" : "text-muted-foreground")} />
        <span className="tabular-nums">{typeof left === "number" ? left.toFixed(2) : String(left ?? "—")}</span>
      </span>
    </div>
  );
}
