// components/hitl/core/hitl-shell.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface HITLShellProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

export function HITLShell({ header, sidebar, children, className, ...rest }: HITLShellProps) {
  return (
    <div {...rest} className={cn("flex min-h-0 flex-1 flex-col bg-background", className)}>
      {header ? <div className="border-b border-border/60">{header}</div> : null}
      <div className="flex min-h-0 flex-1">
        {sidebar ? (
          <aside
            aria-label="HITL navigation"
            className="hidden w-64 shrink-0 border-r border-border/60 md:block"
          >
            {sidebar}
          </aside>
        ) : null}
        <div className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}