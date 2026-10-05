// components/automation/core/automation-shell.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AutomationShellProps {
  header?: React.ReactNode;
  toolbar?: React.ReactNode;
  palette?: React.ReactNode;
  canvas: React.ReactNode;
  inspector?: React.ReactNode;
  bottomPanel?: React.ReactNode;
  footer?: React.ReactNode;
  paletteOpen?: boolean;
  inspectorOpen?: boolean;
  className?: string;
}

export function AutomationShell({
  header,
  toolbar,
  palette,
  canvas,
  inspector,
  bottomPanel,
  footer,
  paletteOpen = true,
  inspectorOpen = true,
  className,
}: AutomationShellProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-background", className)}>
      {header ? <div className="border-b border-border/60">{header}</div> : null}
      {toolbar ? <div className="border-b border-border/60 px-3 py-2">{toolbar}</div> : null}

      <div className="flex min-h-0 flex-1">
        {paletteOpen && palette ? (
          <aside
            aria-label="Node palette"
            className="hidden w-72 shrink-0 border-r border-border/60 md:block"
          >
            <div className="h-full overflow-y-auto">{palette}</div>
          </aside>
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">{canvas}</div>
          {bottomPanel ? (
            <div className="border-t border-border/60">{bottomPanel}</div>
          ) : null}
        </div>

        {inspectorOpen && inspector ? (
          <aside
            aria-label="Properties"
            className="hidden w-80 shrink-0 border-l border-border/60 lg:block"
          >
            <div className="h-full overflow-y-auto">{inspector}</div>
          </aside>
        ) : null}
      </div>

      {footer ? (
        <div className="border-t border-border/60 px-3 py-1.5">{footer}</div>
      ) : null}
    </div>
  );
}
