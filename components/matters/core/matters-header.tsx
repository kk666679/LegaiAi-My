// components/matters/core/matters-header.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MattersHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
}

export function MattersHeader({ title, description, breadcrumbs, actions, className, ...rest }: MattersHeaderProps) {
  return (
    <header
      {...rest}
      className={cn(
        "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {breadcrumbs ? <div className="text-sm text-muted-foreground">{breadcrumbs}</div> : null}
        <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
