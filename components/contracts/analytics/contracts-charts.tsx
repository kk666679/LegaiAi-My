"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";

export interface ContractsChartsProps { title?: string; children: React.ReactNode; }
export function ContractsChartCard({ title, children }: ContractsChartsProps) {
  return (
    <Card className="p-4">
      {title ? <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p> : null}
      {children}
    </Card>
  );
}
