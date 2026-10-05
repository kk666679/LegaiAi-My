// components/matters/analysis/matter-analysis.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";

export interface MatterAnalysisFinding {
  id: string;
  kind: "risk" | "obligation" | "deadline" | "party" | "clause";
  title: string;
  summary?: string;
  severity?: "low" | "medium" | "high" | "critical";
  confidence?: number;
}

export interface MatterAnalysisProps {
  summary?: string;
  findings: MatterAnalysisFinding[];
}

export function MatterAnalysis({ summary, findings }: MatterAnalysisProps) {
  return (
    <div className="space-y-4">
      <Card className="space-y-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Matter summary</p>
        <p className="text-sm leading-relaxed">{summary ?? "Run matter analysis to generate a summary."}</p>
      </Card>
      <section aria-labelledby="findings-heading" className="space-y-2">
        <h2 id="findings-heading" className="text-sm font-medium">
          Key findings
        </h2>
        {findings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No findings yet.</p>
        ) : (
          <ul className="space-y-2">
            {findings.map((f) => (
              <li key={f.id}>
                <Card className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{f.title}</p>
                    {f.severity ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                        {f.severity}
                      </span>
                    ) : null}
                  </div>
                  {f.summary ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{f.summary}</p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
