// components/matters/core/matters-toolbar.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MattersToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  start?: React.ReactNode;
  end?: React.ReactNode;
}

export function MattersToolbar({ start, end, className, ...rest }: MattersToolbarProps) {
  return (
    <div
      {...rest}
      role="toolbar"
      className={cn("flex w-full flex-wrap items-center gap-2 md:flex-nowrap", className)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">{start}</div>
      <div className="flex items-center gap-2">{end}</div>
    </div>
  );
}
