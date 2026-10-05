// components/documents/analysis/analysis-findings.tsx
"use client";

import * as React from "react";
import { AlertTriangle, Calendar, FileText, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DocumentAnalysisFinding } from "../types";

const ICONS: Record<DocumentAnalysisFinding["kind"], React.ReactNode> = {
  risk: <AlertTriangle className="size-4 text-destructive" />,
  obligation: <FileText className="size-4 text-blue-500" />,
  date: <Calendar className="size-4 text-amber-500" />,
  clause: <FileText className="size-4 text-muted-foreground" />,
  party: <Scale className="size-4 text-muted-foreground" />,
  compliance: <Scale className="size-4 text-emerald-500" />,
};

export interface AnalysisFindingsProps {
  findings: DocumentAnalysisFinding[];
  onSelect?: (finding: DocumentAnalysisFinding) => void;
}

export function AnalysisFindings({ findings, onSelect }: AnalysisFindingsProps) {
  if (!findings.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No findings yet. Run an analysis to surface risks, obligations, and important dates.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {findings.map((f) => (
        <li key={f.id}>
          <Card
            role="button"
            tabIndex={0}
            onClick={() => onSelect?.(f)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSelect?.(f);
            }}
            className="cursor-pointer p-3 transition-colors hover:border-primary/40"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{ICONS[f.kind]}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{f.title}</p>
                  {f.severity ? (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {f.severity}
                    </Badge>
                  ) : null}
                </div>
                {f.summary ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{f.summary}</p>
                ) : null}
                {typeof f.confidence === "number" ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Confidence {Math.round(f.confidence * 100)}%
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
