import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

interface MetricCardProps {
  label: string;
  value: number | string;
  icon?: ComponentType<{ className?: string }>;
  accent?: string;
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
  className,
}: MetricCardProps) {
  return (
    <Card className={className}>
      <CardContent className={cn("p-4", Icon && accent && "flex items-center gap-3")}>
        {Icon && accent && (
          <div className={cn("rounded-md p-2", accent)}>
            <Icon className="size-4" />
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">
            {loading ? "…" : value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
