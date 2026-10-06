"use client";
import * as React from "react";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NegotiationRound } from "../types";

const TONE: Record<NegotiationRound["status"], string> = {
  sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  received: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  accepted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive",
  "in-progress": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function NegotiationTrack({ rounds }: { rounds: NegotiationRound[] }) {
  if (!rounds.length) return <p className="text-sm text-muted-foreground">No negotiation rounds yet.</p>;
  const sorted = [...rounds].sort((a, b) => b.roundNumber - a.roundNumber);
  return (
    <ol className="space-y-2">
      {sorted.map((r) => (
        <li key={r.id}>
          <Card className="p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-muted-foreground">R{r.roundNumber}</span>
                <span className="font-medium">{r.fromParty}</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
                <span className="font-medium">{r.toParty}</span>
              </div>
              <Badge variant="outline" className={cn("border-transparent text-[10px] font-medium capitalize", TONE[r.status])}>{r.status.replace("-", " ")}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(r.sentAt).toLocaleString()}</p>
            {r.summary ? <p className="mt-1.5 text-sm">{r.summary}</p> : null}
            {typeof r.redlineCount === "number" ? <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><MessageSquare className="size-3" />{r.redlineCount} redlines</p> : null}
          </Card>
        </li>
      ))}
    </ol>
  );
}
