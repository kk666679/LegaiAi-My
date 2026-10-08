"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Lightbulb } from "lucide-react";

export interface StudioInsight { id: string; kind: "info" | "warning"; message: string; }
export function StudioInsights({ insights }: { insights: StudioInsight[] }) {
  if (!insights.length) return <p className="p-3 text-xs text-muted-foreground">No insights yet.</p>;
  return (
    <div className="space-y-2 p-3">
      {insights.map((i) => (
        <Card key={i.id} className="flex items-start gap-2 p-2.5 text-xs">
          {i.kind === "warning" ? <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" /> : <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />}
          <span>{i.message}</span>
        </Card>
      ))}
    </div>
  );
}
