// components/matters/charts/primitives/chart-container.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChartContainerProps {
  children: (size: { width: number; height: number }) => React.ReactNode;
  height?: number;
  className?: string;
  ariaLabel?: string;
}

export function ChartContainer({
  children,
  height = 240,
  className,
  ariaLabel,
}: ChartContainerProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 0, height });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        if (w !== size.width) setSize({ width: w, height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      className={cn("relative w-full", className)}
      style={{ minHeight: height }}
    >
      {size.width > 0 ? (
        <div className="absolute inset-0">{children(size)}</div>
      ) : null}
    </div>
  );
}
