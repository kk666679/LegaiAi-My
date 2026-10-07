"use client";

import { cn } from "@/lib/utils";
import { Loader2, Circle, CheckCircle, AlertCircle, PauseCircle } from "lucide-react";

export interface AILiveBadgeProps {
  status: "active" | "idle" | "busy" | "syncing" | "analyzing" | "paused" | "error" | "offline";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  pulse?: boolean;
  className?: string;
}

const statusConfig = {
  active: { icon: Circle, color: "text-emerald-500", bg: "bg-emerald-500", label: "Live", pulse: true },
  idle: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted-foreground", label: "Idle", pulse: false },
  busy: { icon: Loader2, color: "text-primary", bg: "bg-primary", label: "Busy", pulse: true },
  syncing: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-500", label: "Syncing", pulse: true },
  analyzing: { icon: Loader2, color: "text-purple-500", bg: "bg-purple-500", label: "Analyzing", pulse: true },
  paused: { icon: PauseCircle, color: "text-amber-500", bg: "bg-amber-500", label: "Paused", pulse: false },
  error: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500", label: "Error", pulse: false },
  offline: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted-foreground", label: "Offline", pulse: false },
};

const sizeClasses = {
  sm: { dot: "size-1.5", icon: "size-3", gap: "gap-1", text: "text-xs", px: "px-2", py: "py-0.5" },
  md: { dot: "size-2", icon: "size-3.5", gap: "gap-1.5", text: "text-sm", px: "px-2.5", py: "py-1" },
  lg: { dot: "size-2.5", icon: "size-4", gap: "gap-2", text: "text-base", px: "px-3", py: "py-1.5" },
};

export function AILiveBadge({
  status,
  size = "md",
  showLabel = true,
  label,
  pulse = true,
  className,
}: AILiveBadgeProps) {
  const config = statusConfig[status];
  const sizes = sizeClasses[size];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        sizes.gap,
        sizes.px,
        sizes.py,
        `border-${config.color.replace("text-", "")}/30`,
        `bg-${config.color.replace("text-", "")}/10`,
        className
      )}
    >
      {status === "busy" || status === "syncing" || status === "analyzing" ? (
        <Icon className={cn(sizes.icon, config.color, pulse && "animate-spin")} aria-hidden />
      ) : (
        <span
          className={cn(
            sizes.dot,
            "rounded-full",
            pulse && config.pulse && "animate-pulse",
            config.bg
          )}
          aria-hidden
        />
      )}
      {showLabel && <span className={cn(sizes.text, config.color)}>{label ?? config.label}</span>}
    </span>
  );
}