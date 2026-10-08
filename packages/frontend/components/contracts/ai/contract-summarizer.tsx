"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function ContractSummarizer({ summary, keyPoints = [] }: { summary?: string; keyPoints?: string[] }) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <p className="text-sm font-medium">AI summary</p>
      </div>
      <p className="text-sm leading-relaxed">{summary ?? "Run the summariser to generate a plain-English summary."}</p>
      {keyPoints.length ? (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Key points</p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {keyPoints.map((k, i) => <li key={i} className="flex gap-2"><span className="text-muted-foreground">•</span>{k}</li>)}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
