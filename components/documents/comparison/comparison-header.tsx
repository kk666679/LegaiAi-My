"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";

export function ComparisonHeader({ leftLabel, rightLabel, summary }: { leftLabel: string; rightLabel: string; summary?: React.ReactNode }) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Comparing</p>
        <p className="truncate text-sm font-medium">{leftLabel} vs {rightLabel}</p>
      </div>
      {summary}
    </Card>
  );
}
