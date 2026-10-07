"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Bot, Sparkles, AlertTriangle } from "lucide-react";

export interface AIWidgetProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  }>;
  className?: string;
}

export function AIWidget({
  title,
  description,
  children,
  loading = false,
  error,
  onRetry,
  actions,
  className,
}: AIWidgetProps) {
  if (error) {
    return (
      <Card className={cn("border-destructive/50 bg-destructive/5", className)}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="size-6 text-destructive" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Bot className="size-3.5 text-primary" aria-hidden />
              {title}
            </CardTitle>
            {description && <CardDescription className="text-xs">{description}</CardDescription>}
          </div>
          {loading && (
            <Loader2 className="size-4 text-primary animate-spin shrink-0" aria-hidden />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
      {actions && actions.length > 0 && (
        <CardContent className="pt-2 border-t flex flex-wrap gap-2">
          {actions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant ?? "outline"}
              size="sm"
              className="h-8 gap-1.5"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </CardContent>
      )}
    </Card>
  );
}