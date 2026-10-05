"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";

export function ContractSummary({ summary }: { summary?: string }) {
  return (
    <Card className="p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Summary</p>
      <p className="text-sm leading-relaxed">{summary ?? "No summary available."}</p>
    </Card>
  );
}
