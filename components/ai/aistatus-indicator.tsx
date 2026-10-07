"use client";

import { cn } from "@/lib/utils";
import { Circle, CheckCircle, AlertCircle, Loader2, PauseCircle, XCircle, WifiOff } from "lucide-react";

export interface AIStatusIndicatorProps {
  status: "online" | "offline" | "idle" | "busy" | "success" | "error" | "warning" | "connecting" | "syncing" | "pending";
  size?: "sm" | "md" | "lg";
  label?: string;
  showLabel?: boolean;
  showPulse?: boolean;
  className?: string;
}

const statusConfig = {
  online: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500", pulse: true, label: "Online" },
  offline: { icon: WifiOff, color: "text-muted-foreground", bg: "bg-muted-foreground", pulse: false, label: "Offline" },
  idle: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted-foreground", pulse: false, label: "Idle" },
  busy: { icon: Loader2, color: "text-primary", bg: "bg-primary", pulse: true, label: "Busy" },
  success: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500", pulse: false, label: "Success" },
  error: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500", pulse: false, label: "Error" },
  warning: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500", pulse: false, label: "Warning" },
  connecting: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-500", pulse: true, label: "Connecting" },
  syncing: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-500", pulse: true, label: "Syncing" },
  pending: { icon: Loader2, color: "text-amber-500", bg: "bg-amber-500", pulse: true, label: "Pending" },
};

const sizeClasses = {
  sm: { dot: "size-2", icon: "size-3.5", text: "text-xs", gap: "gap-1.5" },
  md: { dot: "size-2.5", icon: "size-4", text: "text-sm", gap: "gap-2" },
  lg: { dot: "size-3", icon: "size-5", text: "text-base", gap: "gap-2.5" },
};

export function AIStatusIndicator({
  status,
  size = "md",
  label,
  showLabel = true,
  showPulse = true,
  className,
}: AIStatusIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeClasses[size];
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center", sizes.gap, className)}>
      <Icon
        className={cn(
          sizes.icon,
          config.color,
          showPulse && config.pulse && "animate-spin"
        )}
        aria-hidden
      />
      {showLabel && (
        <span className={cn(sizes.text, "font-medium", config.color)}>
          {label ?? config.label}
        </span>
      )}
    </span>
  );
}