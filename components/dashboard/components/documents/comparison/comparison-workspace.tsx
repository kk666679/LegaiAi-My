// components/documents/comparison/comparison-workspace.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";

export interface ComparisonPane {
  label: string;
  content: React.ReactNode;
}

export interface ComparisonWorkspaceProps {
  left: ComparisonPane;
  right: ComparisonPane;
  summary?: React.ReactNode;
}

export function ComparisonWorkspace({
  left,
  right,
  summary,
}: ComparisonWorkspaceProps) {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {summary ? (
        <Card className="p-3 text-sm">{summary}</Card>
      ) : null}
      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-2">
        <Card className="flex min-h-0 flex-col">
          <div className="border-b border-border/60 px-3 py-2 text-sm font-medium">
            {left.label}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">{left.content}</div>
        </Card>
        <Card className="flex min-h-0 flex-col">
          <div className="border-b border-border/60 px-3 py-2 text-sm font-medium">
            {right.label}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">{right.content}</div>
        </Card>
      </div>
    </div>
  );
}
