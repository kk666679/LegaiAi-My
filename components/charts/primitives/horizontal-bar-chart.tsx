// components/matters/charts/primitives/horizontal-bar-chart.tsx
"use client";

import * as React from "react";
import { ChartContainer } from "./chart-container";
import { ChartTooltip, type ChartTooltipState } from "./chart-tooltip";
import { colorAt, formatCompact, resolveColor, truncateLabel } from "./chart-utils";

export interface HBarDatum {
  label: string;
  value: number;
  color?: string;
}

export interface HorizontalBarChartProps {
  data: HBarDatum[];
  height?: number;
  valueFormatter?: (n: number) => string;
  labelWidth?: number;
  sortDescending?: boolean;
  ariaLabel?: string;
  onSelect?: (d: HBarDatum) => void;
}

export function HorizontalBarChart({
  data,
  height,
  valueFormatter = formatCompact,
  labelWidth = 110,
  sortDescending = true,
  ariaLabel,
  onSelect,
}: HorizontalBarChartProps) {
  const [tooltip, setTooltip] = React.useState<ChartTooltipState | null>(null);
  const [width, setWidth] = React.useState(0);

  const rows = React.useMemo(
    () =>
      sortDescending
        ? [...data].sort((a, b) => b.value - a.value)
        : [...data],
    [data, sortDescending],
  );

  const ROW_H = 26;
  const computedHeight = height ?? Math.max(80, rows.length * ROW_H + 16);
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0) || 1;

  if (rows.length === 0) return null;

  return (
    <ChartContainer height={computedHeight} ariaLabel={ariaLabel}>
      {({ width: w, height: h }) => {
        setWidth(w);
        const barAreaX = labelWidth + 8;
        const barAreaW = Math.max(40, w - barAreaX - 60);

        return (
          <div className="relative size-full">
            <svg width={w} height={h} role="presentation">
              {rows.map((d, i) => {
                const y = 8 + i * ROW_H;
                const barW = (d.value / max) * barAreaW;
                const color = resolveColor(d.color ?? colorAt(i), i);
                return (
                  <g key={i}>
                    <text
                      x={labelWidth}
                      y={y + ROW_H / 2}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className="fill-foreground text-xs"
                    >
                      {truncateLabel(d.label, 18)}
                    </text>
                    <rect
                      x={barAreaX}
                      y={y + 5}
                      width={Math.max(0, barW)}
                      height={ROW_H - 10}
                      rx={3}
                      fill={color}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onMouseEnter={() =>
                        setTooltip({
                          x: barAreaX + barW,
                          y: y + ROW_H / 2,
                          rows: [
                            { label: d.label, value: valueFormatter(d.value), color },
                          ],
                        })
                      }
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => onSelect?.(d)}
                    />
                    <text
                      x={barAreaX + barW + 6}
                      y={y + ROW_H / 2}
                      dominantBaseline="middle"
                      className="fill-muted-foreground text-[10px] tabular-nums"
                    >
                      {valueFormatter(d.value)}
                    </text>
                  </g>
                );
              })}
            </svg>
            <ChartTooltip state={tooltip} containerWidth={width} />
          </div>
        );
      }}
    </ChartContainer>
  );
}
