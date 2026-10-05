"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { ComparisonDiff, type DiffLine } from "../comparison/comparison-diff";

export function VersionDiff({ lines, fromLabel, toLabel }: { lines: DiffLine[]; fromLabel?: string; toLabel?: string }) {
  return (
    <Card className="p-3">
      {(fromLabel || toLabel) ? <p className="mb-2 text-xs text-muted-foreground">{fromLabel} → {toLabel}</p> : null}
      <ComparisonDiff lines={lines} />
    </Card>
  );
}
