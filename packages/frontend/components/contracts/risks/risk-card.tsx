"use client";
import * as React from "react";
import { Shield, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ContractRisk } from "../types";
import { RiskSeverityBadge } from "./risk-severity-badge";

export function RiskCard({ risk, onSelect }: { risk: ContractRisk; onSelect?: (r: ContractRisk) => void }) {
  const critical = risk.severity === "critical" || risk.severity === "high";
  return (
    <Card role="button" tabIndex={0} onClick={() => onSelect?.(risk)} onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(risk); }}
      className={cn("cursor-pointer p-3 transition-colors hover:border-primary/40", critical && "border-destructive/40")}>
      <div className="flex items-start gap-3">
        <div className={cn("rounded-md p-1.5", critical ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
          {critical ? <ShieldAlert className="size-3.5" /> : <Shield className="size-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{risk.title}</p>
            <RiskSeverityBadge severity={risk.severity} />
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{risk.description}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="capitalize">{risk.category}</span>
            <span>·</span>
            <span>Likelihood: {risk.likelihood.replace("-", " ")}</span>
            <span>·</span>
            <span>Impact: {risk.impact}</span>
          </div>
          {risk.mitigation ? <p className="mt-1.5 text-xs text-muted-foreground">Mitigation: {risk.mitigation}</p> : null}
        </div>
      </div>
    </Card>
  );
}
