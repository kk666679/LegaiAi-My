"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";

export function ComparisonPane({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card className="flex min-h-0 flex-col">
      <div className="border-b border-border/60 px-3 py-2 text-sm font-medium">{label}</div>
      <div className="min-h-0 flex-1 overflow-auto p-3">{children}</div>
    </Card>
  );
}
