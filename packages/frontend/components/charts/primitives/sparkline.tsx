// components/matters/charts/primitives/sparkline.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { areaPath, linePath, type Pt } from "./chart-utils";

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  area?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 96,
  height = 28,
  color = "hsl(217 91% 60%)",
  area = true,
  className,
}: SparklineProps) {
  if (data.length < 2) {
    return <div className={cn("inline-block", className)} style={{ width, height }} aria-hidden />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const padY = 3;
  const innerH = height - padY * 2;

  const pts: Pt[] = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: padY + innerH * (1 - (v - min) / span),
  }));

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("inline-block", className)}
      role="presentation"
      aria-hidden
    >
      {area ? <path d={areaPath(pts, height, true)} fill={color} fillOpacity={0.15} /> : null}
      <path d={linePath(pts, true)} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}
