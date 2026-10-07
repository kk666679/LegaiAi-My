"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

export interface AIInsightCardProps {
  title: string;
  description: string;
  insight: string;
  type: "positive" | "negative" | "warning" | "neutral" | "info";
  metric?: {
    label: string;
    value: string | number;
    trend?: number;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const typeConfig = {
  positive: { icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", badge: "Positive" },
  negative: { icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", badge: "Negative" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", badge: "Warning" },
  neutral: { icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", badge: "Neutral" },
  info: { icon: AlertTriangle, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", badge: "Info" },
};

export function AIInsightCard({
  title,
  description,
  insight,
  type = "info",
  metric,
  action,
  className,
}: AIInsightCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Card className={cn("border-l-4", config.border, className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <Badge variant="outline" className={cn("text-[10px] border-0 bg-transparent p-0", config.color)}>
            <Icon className="size-2.5 mr-1" aria-hidden />
            {config.badge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed">{insight}</p>
        {metric && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">{metric.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tabular-nums">{metric.value}</span>
              {metric.trend !== undefined && metric.trend !== 0 && (
                <span className={cn("text-[10px] font-medium", metric.trend > 0 ? "text-emerald-500" : "text-red-500")}>
                  {metric.trend > 0 ? <TrendingUp className="size-2.5 inline" aria-hidden /> : <TrendingDown className="size-2.5 inline" aria-hidden />}
                  {Math.abs(metric.trend)}%
                </span>
              )}
            </div>
          </div>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="w-full text-sm font-medium text-primary hover:underline flex items-center justify-center gap-1"
          >
            {action.label}
          </button>
        )}
      </CardContent>
    </Card>
  );
}