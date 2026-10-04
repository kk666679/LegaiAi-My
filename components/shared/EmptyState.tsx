import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Standard empty state: explains what happened and what the
 * user can do next. Used by every data-driven section.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionHref,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: string;
  actionHref?: string;
  className?: string;
}) {
  return (
    <Empty className={cn("py-10", className)}>
      <EmptyHeader>
        {Icon && (
          <EmptyMedia variant="icon">
            <Icon className="size-4" aria-hidden />
          </EmptyMedia>
        )}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {(action || actionHref) && (
        <EmptyContent>
          {actionHref ? (
            <Button asChild size="sm">
              <Link href={actionHref}>{action}</Link>
            </Button>
          ) : (
            <Button size="sm" disabled>
              {action}
            </Button>
          )}
        </EmptyContent>
      )}
    </Empty>
  );
}

/** Compact empty row for lists/tables. */
export function EmptyRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-10 text-center text-sm text-muted-foreground"
      >
        {message}
      </td>
    </tr>
  );
}
