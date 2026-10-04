import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Consistent page header used across /legalai sections.
 * Keeps title, description and action row aligned everywhere.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground text-balance">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}

/** Card section header for consistent in-card headings. */
export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
