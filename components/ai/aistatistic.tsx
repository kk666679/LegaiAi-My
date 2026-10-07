"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface AIStatisticProps {
  label: string;
  value: number | string;
  size?: "sm" | "md" | "lg";
  trend?: number;
  icon?: React.ReactNode;
  className?: string;
  format?: (value: number | string) => string;
}

const sizeClasses = {
  sm: { value: "text-lg", label: "text-[10px]", icon: "size-3.5", gap: "gap-1.5", p: "p-2" },
  md: { value: "text-xl", label: "text-xs", icon: "size-4", gap: "gap-2", p: "p-3" },
  lg: { value: "text-2xl", label: "text-sm", icon: "size-5", gap: "gap-2.5", p: "p-4" },
};

export function AIStatistic({
  label,
  value,
  size = "md",
  trend,
  icon,
  className,
  format,
}: AIStatisticProps) {
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
    <div
      className={cn(
        "flex flex-col items-start rounded-lg border bg-card/50",
        sizes.p,
        sizes.gap,
        className
      )}
    >
      <div className="flex items-baseline gap-1.5">
        {icon && <span className={cn(sizes.icon, "text-muted-foreground")}>{icon}</span>}
        <span className={cn(sizes.value, "font-semibold tabular-nums")}>{displayValue}</span>
        {trendIcon}
      </div>
      <span className={cn(sizes.label, "text-muted-foreground font-medium")}>{label}</span>
      {trend !== undefined && (
        <span className={cn("text-[10px] font-medium", trend > 0 ? "text-emerald-500" : trend < 0 ? "text-red-500" : "text-muted-foreground")}>
          {trend > 0 ? "+" : ""}{trend}%
        </span>
      )}
    </div>
  );
}