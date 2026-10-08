// components/matters/core/matters-shell.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MattersShellProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  navigation?: React.ReactNode;
  toolbar?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

export function MattersShell({
  header,
  navigation,
  toolbar,
  sidebar,
  children,
  className,
  ...rest
}: MattersShellProps) {
  return (
    <div {...rest} className={cn("flex min-h-0 flex-1 flex-col bg-background", className)}>
      {header ? <div className="border-b border-border/60">{header}</div> : null}
      <div className="flex min-h-0 flex-1">
        {sidebar ? (
          <aside
            aria-label="Matter navigation"
            className="hidden w-64 shrink-0 border-r border-border/60 md:block"
          >
            {sidebar}
          </aside>
        ) : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {navigation ? (
            <div className="border-b border-border/60 px-4 py-2">{navigation}</div>
          ) : null}
          {toolbar ? (
            <div className="border-b border-border/60 px-4 py-3">{toolbar}</div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
