"use client";

import { cn } from "@/lib/utils";
import { Loader2, Bot, Sparkles, Brain, Zap, Mic, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

export interface AIOrbProps {
  status?: "idle" | "listening" | "thinking" | "speaking" | "error";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showLabel?: boolean;
  label?: string;
  streaming?: boolean;
}

const sizeClasses = {
  sm: "size-12",
  md: "size-20",
  lg: "size-32",
  xl: "size-48",
};

const statusConfig = {
  idle: { icon: Bot, color: "text-muted-foreground", bg: "bg-muted/30", pulse: false },
  listening: { icon: Mic, color: "text-primary", bg: "bg-primary/10", pulse: true },
  thinking: { icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10", pulse: true },
  speaking: { icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10", pulse: true },
  error: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10", pulse: false },
};

export function AIOrb({
  status = "idle",
  size = "md",
  className,
  showLabel = false,
  label,
  streaming = false,
}: AIOrbProps) {
  const [pulse, setPulse] = useState(false);
  const config = statusConfig[status];

  useEffect((): (() => void) | void => {
    if (config.pulse) {
      const interval = setInterval(() => setPulse((p) => !p), 1000);
      return () => clearInterval(interval);
    }
    setPulse(false);
  }, [config.pulse]);

  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full border-2 transition-all duration-300",
          sizeClasses[size],
          config.bg,
          `border-${config.color.replace("text-", "")}/30`
        )}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full opacity-30 animate-ping",
            pulse && config.pulse && `bg-${config.color.replace("text-", "")}/50`
          )}
        />
        <Icon className={cn("relative z-10", config.color, {
          "size-5": size === "sm",
          "size-8": size === "md",
          "size-12": size === "lg",
          "size-16": size === "xl",
        })} />
        {streaming && (
          <div className="absolute -bottom-1 -right-1 size-3 bg-primary rounded-full border-2 border-background animate-pulse" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-center max-w-[120px]">
          {label ?? status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )}
    </div>
  );
}