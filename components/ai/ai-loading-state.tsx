"use client";

import { cn } from "@/lib/utils";
import { Loader2, Bot, Sparkles } from "lucide-react";

export interface AILoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "spinner" | "dots" | "pulse" | "orb";
}

export function AILoadingState({
  message = "Processing...",
  size = "md",
  className,
  variant = "spinner",
}: AILoadingStateProps) {
  const sizeClasses = {
    sm: { icon: "size-4", text: "text-xs", gap: "gap-1.5" },
    md: { icon: "size-5", text: "text-sm", gap: "gap-2" },
    lg: { icon: "size-6", text: "text-base", gap: "gap-3" },
  };

  const sizes = sizeClasses[size];

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center", sizes.gap, className)}>
        <div className="flex gap-1" aria-label="Loading">
          <div className={cn("size-1.5 rounded-full bg-primary animate-bounce", "animation-delay-0")} />
          <div className={cn("size-1.5 rounded-full bg-primary animate-bounce", "animation-delay-100")} />
          <div className={cn("size-1.5 rounded-full bg-primary animate-bounce", "animation-delay-200")} />
        </div>
        <span className={cn(sizes.text, "text-muted-foreground")}>{message}</span>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex items-center", sizes.gap, className)}>
        <div className={cn(sizes.icon, "rounded-full bg-primary/20 animate-pulse")} aria-hidden />
        <span className={cn(sizes.text, "text-muted-foreground")}>{message}</span>
      </div>
    );
  }

  if (variant === "orb") {
    return (
      <div className={cn("flex flex-col items-center", sizes.gap, className)}>
        <div className="relative">
          <div className={cn(sizes.icon, "rounded-full bg-primary/10 border-2 border-primary/30 animate-ping")} />
          <Bot className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary", sizes.icon)} aria-hidden />
        </div>
        <span className={cn(sizes.text, "text-muted-foreground")}>{message}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", sizes.gap, className)}>
      <Loader2 className={cn(sizes.icon, "text-primary animate-spin")} aria-hidden />
      <span className={cn(sizes.text, "text-muted-foreground")}>{message}</span>
    </div>
  );
}