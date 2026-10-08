"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContractsToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  start?: React.ReactNode;
  center?: React.ReactNode;
  end?: React.ReactNode;
}

export function ContractsToolbar({ start, center, end, className, ...rest }: ContractsToolbarProps) {
  return (
    <div {...rest} role="toolbar" className={cn("flex w-full flex-wrap items-center gap-2 md:flex-nowrap", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-2">{start}</div>
      {center ? <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">{center}</div> : null}
      <div className="flex items-center gap-2">{end}</div>
    </div>
  );
}
