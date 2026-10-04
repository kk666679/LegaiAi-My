import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * Unified status/priority badges shared by matters, documents
 * and tasks so status communicates the same everywhere.
 * Colour is never the only signal — a label is always rendered.
 */

type Tone =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  default: "bg-primary/10 text-primary border-primary/25",
  success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/25",
  destructive: "bg-red-500/10 text-red-500 border-red-500/25",
  info: "bg-blue-500/10 text-blue-500 border-blue-500/25",
  neutral: "bg-muted text-muted-foreground border-border",
};

function toneFor(value: string): Tone {
  switch (value) {
    case "active":
    case "approved":
    case "done":
    case "completed":
    case "healthy":
    case "ready":
    case "verified":
      return "success";
    case "urgent":
    case "high":
    case "critical":
    case "blocked":
    case "overdue":
    case "degraded":
      return "destructive";
    case "on_hold":
    case "review":
    case "pending":
    case "processing":
    case "in_progress":
    case "todo":
    case "medium":
    case "warning":
      return "warning";
    case "open":
    case "draft":
    case "low":
    case "info":
      return "info";
    case "closed":
    case "archived":
    default:
      return "neutral";
  }
}

export function StatusBadge({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium", TONE_CLASSES[toneFor(value)], className)}
    >
      {label ?? value.replace(/_/g, " ")}
    </Badge>
  );
}

/** Severity dot + label for risk/alerts. Never colour alone. */
export function SeverityBadge({
  severity,
  className,
}: {
  severity: "high" | "medium" | "low" | "critical" | "info" | "warning";
  className?: string;
}) {
  const normalized =
    severity === "critical"
      ? "critical"
      : severity === "warning"
        ? "medium"
        : severity;
  return (
    <StatusBadge
      value={normalized}
      className={className}
      label={
        severity === "critical"
          ? "Critical"
          : severity === "warning"
            ? "Medium"
            : severity
      }
    />
  );
}
