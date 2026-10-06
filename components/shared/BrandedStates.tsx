"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LawMateMark, Logo } from "@/components/navigation/Logo";
import { Sparkles, Search, FileText, Plus, Shield, Scale, RefreshCw } from "lucide-react";

type EmptyStateVariant = "default" | "search" | "documents" | "matters" | "results" | "permissions" | "offline";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  showBrandMark?: boolean;
}

const VARIANT_CONFIG: Record<EmptyStateVariant, {
  icon: React.ReactNode;
  defaultTitle: string;
  defaultDescription: string;
}> = {
  default: {
    icon: <LawMateMark size="xl" className="text-muted-foreground/30" />,
    defaultTitle: "Nothing here yet",
    defaultDescription: "Get started by creating your first item or exploring the platform.",
  },
  search: {
    icon: (
      <div className="relative flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Search className="size-8" />
        <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="size-3" />
        </span>
      </div>
    ),
    defaultTitle: "No results found",
    defaultDescription: "Try adjusting your search terms or filters to find what you're looking for.",
  },
  documents: {
    icon: (
      <div className="relative flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FileText className="size-8" />
        <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Plus className="size-3" />
        </span>
      </div>
    ),
    defaultTitle: "No documents yet",
    defaultDescription: "Upload your first document or create one using the Drafting Studio to get started.",
  },
  matters: {
    icon: (
      <div className="relative flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Scale className="size-8" />
        <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Plus className="size-3" />
        </span>
      </div>
    ),
    defaultTitle: "No matters found",
    defaultDescription: "Create your first matter to start organizing your legal work.",
  },
  results: {
    icon: <LawMateMark size="xl" className="text-muted-foreground/30" />,
    defaultTitle: "No matching results",
    defaultDescription: "Your search didn't return any results. Try different keywords or broaden your filters.",
  },
  permissions: {
    icon: (
      <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Shield className="size-8" />
      </div>
    ),
    defaultTitle: "Access restricted",
    defaultDescription: "You don't have permission to view this content. Contact your administrator for access.",
  },
  offline: {
    icon: (
      <div className="relative flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <RefreshCw className="size-8 animate-spin" />
      </div>
    ),
    defaultTitle: "You're offline",
    defaultDescription: "Check your connection and try again. Some features may be limited while offline.",
  },
};

export function EmptyState({
  variant = "default",
  title,
  description,
  action,
  secondaryAction,
  className,
  showBrandMark = false,
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <div className={cn("empty-state", className)}>
      {config.icon}
      {showBrandMark && (
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border border-border/70 bg-muted/40">
          <LawMateMark size="sm" className="text-primary" />
          <span className="text-xs font-medium text-muted-foreground">LAW MATE</span>
        </div>
      )}
      <h3 className="empty-state-title">{title ?? config.defaultTitle}</h3>
      <p className="empty-state-description">{description ?? config.defaultDescription}</p>
      {(action || secondaryAction) && (
        <div className="empty-state-action flex flex-col sm:flex-row items-center justify-center gap-2 w-full">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant ?? "default"}
              size="lg"
              className={cn(
                "w-full sm:w-auto",
                action.variant === "default" && "bg-gradient-to-r from-[hsl(var(--brand-blue))] to-[hsl(var(--brand-indigo))] hover:from-[hsl(var(--brand-blue-dark))] hover:to-[hsl(var(--brand-indigo))]"
              )}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface LoadingStateProps {
  variant?: "default" | "brand" | "inline";
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingState({
  variant = "default",
  text,
  size = "md",
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-6",
    lg: "size-10",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (variant === "inline") {
    return (
      <div className={cn("loading-brand inline-flex items-center gap-1.5", className)}>
        <svg className={cn("loading-brand-spinner", sizeClasses[size])} viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        {text && <span className={cn("loading-brand-text", textSizeClasses[size])}>{text}</span>}
      </div>
    );
  }

  return (
    <div className={cn("loading-brand flex flex-col items-center justify-center gap-3 p-8", className)}>
      <svg className={cn("loading-brand-spinner", sizeClasses[size])} viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      {text && <span className={cn("loading-brand-text", textSizeClasses[size])}>{text}</span>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  };
  className?: string;
  showBrandMark?: boolean;
}

export function ErrorState({
  title,
  description,
  action,
  className,
  showBrandMark = true,
}: ErrorStateProps) {
  return (
    <div className={cn("error-state", className)}>
      <div className="relative flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Sparkles className="size-6" />
        <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
          <Shield className="size-2.5" />
        </span>
      </div>
      {showBrandMark && (
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border border-border/70 bg-muted/40">
          <LawMateMark size="sm" className="text-destructive" />
          <span className="text-xs font-medium text-muted-foreground">LAW MATE</span>
        </div>
      )}
      <h3 className="error-state-title">{title ?? "Something went wrong"}</h3>
      <p className="error-state-description">{description ?? "An unexpected error occurred. Please try again or contact support."}</p>
      {action && (
        <div className="error-state-action">
          <Button
            onClick={action.onClick}
            variant="default"
            className="bg-gradient-to-r from-[hsl(var(--brand-blue))] to-[hsl(var(--brand-indigo))] hover:from-[hsl(var(--brand-blue-dark))] hover:to-[hsl(var(--brand-indigo))]"
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

export function PageLoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-6 p-6", className)}>
      <div className="h-8 w-3/12 animate-pulse rounded bg-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
      <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card animate-pulse flex flex-col gap-4", className)}>
      <div className="h-6 w-2/3 rounded bg-muted" />
      <div className="h-4 w-full rounded bg-muted" />
      <div className="h-4 w-5/6 rounded bg-muted" />
      <div className="h-10 w-1/3 rounded bg-muted mt-auto" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-4">
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="h-5 flex-1 animate-pulse rounded bg-muted" />
        ))}
      </div>
      {[...Array(rows)].map((_, row) => (
        <div key={row} className="flex gap-4">
          {[...Array(columns)].map((_, i) => (
            <div key={i} className="h-4 flex-1 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ))}
    </div>
  );
}