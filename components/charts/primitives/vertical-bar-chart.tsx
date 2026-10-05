// components/matters/charts/primitives/vertical-bar-chart.tsx
"use client";

import * as React from "react";
import { ChartContainer } from "./chart-container";
import { ChartTooltip, type ChartTooltipState } from "./chart-tooltip";
import {
  colorAt,
  formatCompact,
  niceTicks,
  resolveColor,
  stackedMaxOf,
  maxOf,
  truncateLabel,
} from "./chart-utils";

export interface VerticalBarSeries {
  name: string;
  color?: string;
}

export interface VerticalBarDatum {
  label: string;
  values: number[]; // one per series
}

export interface VerticalBarChartProps {
  data: VerticalBarDatum[];
  series: VerticalBarSeries[];
  mode?: "grouped" | "stacked";
  height?: number;
  valueFormatter?: (n: number) => string;
  ariaLabel?: string;
  onSelect?: (d: VerticalBarDatum, seriesIndex: number) => void;
}

const PAD = { top: 12, right: 12, bottom: 34, left: 40 };

export function VerticalBarChart({
  data,
  series,
  mode = "grouped",
  height = 240,
  valueFormatter = formatCompact,
  ariaLabel,
  onSelect,
}: VerticalBarChartProps) {
  const [tooltip, setTooltip] = React.useState<ChartTooltipState | null>(null);
  const [width, setWidth] = React.useState(0);

  if (data.length === 0 || series.length === 0) return null;

  const plotMax = mode === "stacked" ? stackedMaxOf(data) : maxOf(data);
  const ticks = niceTicks(plotMax, 4);
  const top = ticks[ticks.length - 1] || 1;

  return (
    <ChartContainer height={height} ariaLabel={ariaLabel}>
      {({ width: w, height: h }) => {
        setWidth(w);
        const plotW = w - PAD.left - PAD.right;
        const plotH = h - PAD.top - PAD.bottom;
        const groupW = plotW / data.length;
        const barW =
          mode === "stacked"
            ? Math.max(6, groupW * 0.6)
            : Math.max(4, (groupW * 0.7) / series.length);

        const yScale = (v: number) => PAD.top + plotH * (1 - v / top);

        return (
          <div className="relative size-full">
            <svg width={w} height={h} role="presentation">
              {/* Y grid + labels */}
              {ticks.map((t, i) => (
                <g key={i}>
                  <line
                    x1={PAD.left}
                    x2={w - PAD.right}
                    y1={yScale(t)}
                    y2={yScale(t)}
                    stroke="currentColor"
                    strokeOpacity={i === 0 ? 0.25 : 0.1}
                  />
                  <text
                    x={PAD.left - 6}
                    y={yScale(t)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {valueFormatter(t)}
                  </text>
                </g>
              ))}

              {data.map((d, i) => {
                const gx = PAD.left + i * groupW;
                let stackY = PAD.top + plotH;

                return (
                  <g key={i}>
                    {series.map((s, si) => {
                      const v = d.values[si] ?? 0;
                      const color = resolveColor(s.color ?? colorAt(si), si);
                      let x: number;
                      let y: number;
                      let bh: number;
                      if (mode === "stacked") {
                        x = gx + (groupW - barW) / 2;
                        bh = plotH * (v / top);
                        stackY -= bh;
                        y = stackY;
                      } else {
                        x = gx + groupW * 0.15 + si * barW;
                        bh = plotH * (v / top);
                        y = PAD.top + plotH - bh;
                      }
                      return (
                        <rect
                          key={si}
                          x={x}
                          y={y}
                          width={barW}
                          height={Math.max(0, bh)}
                          fill={color}
                          className="cursor-pointer transition-opacity hover:opacity-80"
                          onMouseEnter={() => {
                            setTooltip({
                              x: gx + groupW / 2,
                              y: PAD.top + plotH - bh,
                              title: d.label,
                              rows: series.map((ss, ssi) => ({
                                label: ss.name,
                                value: valueFormatter(d.values[ssi] ?? 0),
                                color: resolveColor(ss.color ?? colorAt(ssi), ssi),
                              })),
                            });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                          onClick={() => onSelect?.(d, si)}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* X labels */}
              {data.map((d, i) => (
                <text
                  key={i}
                  x={PAD.left + i * groupW + groupW / 2}
                  y={h - PAD.bottom + 14}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {truncateLabel(d.label, Math.max(6, Math.floor(groupW / 6)))}
                </text>
              ))}
            </svg>
            <ChartTooltip state={tooltip} containerWidth={width} />
          </div>
        );
      }}
    </ChartContainer>
  );
}
