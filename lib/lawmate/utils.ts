import type { Severity } from "@/types/lawmate";

export function severityClasses(s: Severity): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
} {
  switch (s) {
    case "high":
      return {
        bg: "bg-red-500/10",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-500/30",
        dot: "bg-red-500",
        label: "High",
      };
    case "medium":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/30",
        dot: "bg-amber-500",
        label: "Medium",
      };
    case "low":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500/30",
        dot: "bg-blue-500",
        label: "Low",
      };
    case "info":
    default:
      return {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border",
        dot: "bg-muted-foreground",
        label: "Info",
      };
  }
}

export function riskScoreToLabel(score: number) {
  if (score >= 0.66) return "High";
  if (score >= 0.33) return "Medium";
  return "Low";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function isOverdue(iso?: string) {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}