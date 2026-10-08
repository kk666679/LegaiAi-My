// components/matters/charts/kpi/kpi-card.tsx
"use client";

import * as React from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkline } from "../primitives/sparkline";

export interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number; // percent change vs previous period
  deltaLabel?: string;
  trend?: number[];
  color?: string;
  invertColor?: boolean; // for metrics where "up" is bad
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function KpiCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  trend,
  color = "hsl(217 91% 60%)",
  invertColor = false,
  icon,
  className,
  onClick,
}: KpiCardProps) {
  const up = typeof delta === "number" && delta > 0;
  const flat = typeof delta === "number" && delta === 0;
  const good = invertColor ? !up : up;
  const DeltaIcon = flat ? ArrowRight : up ? ArrowUpRight : ArrowDownRight;
  const deltaTone = flat
    ? "text-muted-foreground"
    : good
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-destructive";

  return (
    <Card
      className={cn("p-4", onClick && "cursor-pointer transition-colors hover:border-primary/40", className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>

      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold tabular-nums">{value}</p>
          {unit ? <p className="text-xs text-muted-foreground">{unit}</p> : null}
        </div>
        {trend && trend.length > 1 ? (
          <Sparkline data={trend} color={color} width={80} height={28} />
        ) : null}
      </div>

      {typeof delta === "number" ? (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span className={cn("inline-flex items-center gap-0.5 font-medium", deltaTone)}>
            <DeltaIcon className="size-3.5" aria-hidden />
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
          {deltaLabel ? <span className="text-muted-foreground">{deltaLabel}</span> : null}
        </div>
      ) : null}
    </Card>
  );
}
