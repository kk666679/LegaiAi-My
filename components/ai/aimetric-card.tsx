"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface AIMetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  format?: (value: number | string) => string;
}

const sizeClasses = {
  sm: { value: "text-2xl", label: "text-xs", icon: "size-4", p: "p-3", gap: "gap-2" },
  md: { value: "text-3xl", label: "text-sm", icon: "size-5", p: "p-4", gap: "gap-3" },
  lg: { value: "text-4xl", label: "text-base", icon: "size-6", p: "p-6", gap: "gap-4" },
};

export function AIMetricCard({
  label,
  value,
  sublabel,
  trend,
  trendLabel,
  icon,
  size = "md",
  className,
  format,
}: AIMetricCardProps) {
  const sizes = sizeClasses[size];
  const displayValue = format ? format(value) : String(value);

  const trendIcon = trend !== undefined && trend !== 0 ? (
    trend > 0 ? (
      <TrendingUp className={cn(sizes.icon, "text-emerald-500")} aria-hidden />
    ) : (
      <TrendingDown className={cn(sizes.icon, "text-red-500")} aria-hidden />
    )
  ) : trend !== undefined ? (
    <Minus className={cn(sizes.icon, "text-muted-foreground")} aria-hidden />
  ) : null;

  return (
    <Card className={cn("border bg-card/50", className)}>
      <CardContent className={cn("flex flex-col items-start", sizes.p, sizes.gap)}>
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div className="flex items-baseline gap-2">
          <span className={cn(sizes.value, "font-semibold tabular-nums")}>{displayValue}</span>
          {trendIcon}
        </div>
        <p className={cn(sizes.label, "text-muted-foreground font-medium")}>{label}</p>
        {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            <span className={cn("text-[10px] font-medium", trend > 0 ? "text-emerald-500" : trend < 0 ? "text-red-500" : "text-muted-foreground")}>
              {trend > 0 ? "+" : ""}{Math.abs(Math.round(trend))}%
            </span>
            {trendLabel && <span className="text-[10px] text-muted-foreground">{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}