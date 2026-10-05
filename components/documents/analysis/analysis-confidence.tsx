"use client";
import * as React from "react";
import { Progress } from "@/components/ui/progress";

export function AnalysisConfidence({ value, label = "Confidence" }: { value: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="tabular-nums">{pct}%</span></div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}
