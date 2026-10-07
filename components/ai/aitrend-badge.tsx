"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface AITrendBadgeProps {
  trend: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: { icon: "size-2.5", text: "text-[10px]", px: "px-1.5", py: "py-0.5" },
  md: { icon: "size-3", text: "text-xs", px: "px-2", py: "py-0.5" },
  lg: { icon: "size-3.5", text: "text-sm", px: "px-2.5", py: "py-1" },
};

export function AITrendBadge({
  trend,
  size = "md",
  showValue = true,
  className,
}: AITrendBadgeProps) {
  const sizes = sizeClasses[size];
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  const isNeutral = trend === 0;

  const config = isPositive
    ? { icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }
    : isNegative
    ? { icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" }
    : { icon: Minus, color: "text-muted-foreground", bg: "bg-muted/10", border: "border-muted/20" };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full border",
        sizes.px,
        sizes.py,
        config.bg,
        config.border,
        className
      )}
    >
      <Icon className={cn(sizes.icon, config.color)} aria-hidden />
      {showValue && (
        <span className={cn(sizes.text, config.color)}>
          {isPositive ? "+" : ""}{Math.abs(Math.round(trend))}%
        </span>
      )}
    </span>
  );
}